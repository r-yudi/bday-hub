import { NextResponse } from "next/server";
import { sendReminderEmail } from "@/lib/server/email";
import { runPushForUser } from "@/lib/server/cronPush";
import { sendPushNotification } from "@/lib/server/push";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import {
  processOneCandidate,
  shouldSendForNow,
  getCandidateDebug,
  dateKeyToDayMonth,
  STALE_PENDING_MS,
  type UserSettingsReminderRow,
  type DailyEmailCronDeps,
  type BirthdayRow,
  type DispatchRow
} from "@/lib/server/dailyEmailCronLogic";
import { getDateKey } from "@/lib/timezone";
import { getDatePartsInTimeZone } from "@/lib/server/dailyReminderDigest";

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret === expected) return true;
  const bearer = request.headers.get("authorization");
  return bearer === `Bearer ${expected}`;
}

function buildCronDeps(supabase: ReturnType<typeof getSupabaseAdminClient>): DailyEmailCronDeps {
  const table = () => supabase.from("daily_email_dispatch" as "user_settings");
  return {
    async insertDispatch(userId: string, dateKey: string) {
      // Table daily_email_dispatch added in migration 20260227; Supabase types not yet regenerated
      const res = await (table() as ReturnType<typeof supabase.from>)
        .insert({ user_id: userId, date_key: dateKey, status: "pending" } as never)
        .select("id")
        .single();
      if (res.error) return { error: res.error.message, code: res.error.code };
      return { id: (res.data as { id: string } | null)?.id ?? "" };
    },
    async getExistingDispatch(userId: string, dateKey: string) {
      const { data } = await (table() as ReturnType<typeof supabase.from>)
        .select("id, status, created_at")
        .eq("user_id", userId)
        .eq("date_key", dateKey)
        .maybeSingle();
      return data as DispatchRow | null;
    },
    async claimStalePending(id: string, now: Date) {
      const cutoff = new Date(now.getTime() - STALE_PENDING_MS).toISOString();
      const res = await (table() as ReturnType<typeof supabase.from>)
        .update({ status: "pending" } as never)
        .eq("id", id)
        .eq("status", "pending")
        .lt("created_at", cutoff)
        .select("id")
        .maybeSingle();
      return !!res.data;
    },
    async updateDispatch(id: string, update: { status: string; error_message?: string; sent_at?: string }) {
      await (table() as ReturnType<typeof supabase.from>).update(update as never).eq("id", id);
    },
    async getBirthdays(userId: string, day: number, month: number) {
      const { data, error } = await supabase
        .from("birthdays")
        .select("name,day,month")
        .eq("user_id", userId)
        .eq("day", day)
        .eq("month", month);
      if (error) return { error: error.message };
      return (data ?? []) as BirthdayRow[];
    },
    async getUserEmail(userId: string) {
      const { data } = await supabase.auth.admin.getUserById(userId);
      return data.user?.email ?? null;
    },
    sendReminderEmail
  };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const now = new Date();
  const xDebug = request.headers.get("x-debug") === "1";
  const debugUserId = request.headers.get("x-debug-user-id")?.trim() || null;
  const forceCandidate =
    request.headers.get("x-debug-force") === "1" &&
    (process.env.NODE_ENV !== "production" || xDebug);
  const url = new URL(request.url);
  const userIdParam = url.searchParams.get("userId");

  const serverNowIso = now.toISOString();
  const serverNowUtc = now.toUTCString();

  if (xDebug && userIdParam) {
    const { data: userRow, error: userError } = await supabase
      .from("user_settings")
      .select("user_id,email_enabled,email_time,timezone,push_enabled")
      .eq("user_id", userIdParam)
      .maybeSingle();
    if (userError) {
      return NextResponse.json(
        { ok: false, message: userError.message, debug: { serverNowIso, serverNowUtc } },
        { status: 500 }
      );
    }
    if (!userRow) {
      return NextResponse.json(
        {
          ok: true,
          debug: {
            serverNowIso,
            serverNowUtc,
            userDebug: null,
            reasonIfNot: "user not found in user_settings"
          }
        },
        { status: 200 }
      );
    }
    const row = userRow as UserSettingsReminderRow;
    const userDebug = getCandidateDebug(row, now);
    const tz = (row.timezone || "America/Sao_Paulo").trim();
    const parts = getDatePartsInTimeZone(tz, now);
    const dateKey = getDateKey(now, tz);
    const { day, month } = dateKeyToDayMonth(dateKey);
    const deps = buildCronDeps(supabase);
    const birthdaysResult = await deps.getBirthdays(row.user_id, day, month);
    const birthdaysFoundForToday = Array.isArray(birthdaysResult) ? birthdaysResult.length : 0;
    const body: Record<string, unknown> = {
      ok: true,
      debug: {
        serverNowIso,
        serverNowUtc,
        scannedUsers: 1,
        candidates: userDebug.isCandidate ? 1 : 0,
        insertsAttempted: 0,
        dispatchRowsWritten: 0,
        lastError: undefined as string | undefined,
        todayInUserTz: parts.isoDate,
        nowInUserTz: parts.hhmm,
        birthdaysFoundForToday,
        userDebug
      }
    };
    if (userDebug.isCandidate) {
      const outcome = await processOneCandidate(deps, row, now);
      (body.debug as Record<string, unknown>).userOutcome = outcome;
      (body.debug as Record<string, unknown>).insertsAttempted = 1;
      if (outcome.outcome === "sent" || outcome.outcome === "skipped") {
        (body.debug as Record<string, unknown>).dispatchRowsWritten = 1;
      } else {
        (body.debug as Record<string, unknown>).lastError = outcome.outcome === "failed" ? outcome.reason : undefined;
      }
    }
    return NextResponse.json(body);
  }

  const deps = buildCronDeps(supabase);
  const summary = {
    scannedUsers: 0,
    candidates: 0,
    sent: 0,
    skippedNoBirthday: 0,
    skippedAlreadySent: 0,
    skippedInvalidEmail: 0,
    failed: 0,
    recoveredStale: 0,
    insertsAttempted: 0,
    dispatchRowsWritten: 0,
    lastError: null as string | null
  };
  const skipReasons: { userId: string; skipReason: string }[] = [];

  let rows: UserSettingsReminderRow[];
  if (debugUserId) {
    const { data: userRow, error: userError } = await supabase
      .from("user_settings")
      .select("user_id,email_enabled,email_time,timezone,push_enabled")
      .eq("user_id", debugUserId)
      .maybeSingle();
    if (userError) {
      return NextResponse.json({ ok: false, message: userError.message }, { status: 500 });
    }
    rows = userRow ? ([userRow] as UserSettingsReminderRow[]) : [];
  } else {
    const { data: settingsRows, error: settingsError } = await supabase
      .from("user_settings")
      .select("user_id,email_enabled,email_time,timezone,push_enabled")
      .eq("email_enabled", true);
    if (settingsError) {
      return NextResponse.json({ ok: false, message: settingsError.message }, { status: 500 });
    }
    rows = (settingsRows ?? []) as UserSettingsReminderRow[];
  }
  summary.scannedUsers = rows.length;

  for (const row of rows) {
    const timezone = (row.timezone || "America/Sao_Paulo").trim();
    const emailTime = (row.email_time || "09:00").trim();
    const isInWindow = shouldSendForNow(emailTime, timezone, now);
    const treatAsCandidate =
      isInWindow || (forceCandidate && debugUserId !== null && row.user_id === debugUserId);

    if (!treatAsCandidate) {
      skipReasons.push({ userId: row.user_id, skipReason: "outside_window" });
      continue;
    }
    summary.candidates += 1;
    summary.insertsAttempted += 1;

    const outcome = await processOneCandidate(deps, row, now);

    if ("recoveredStale" in outcome && outcome.recoveredStale) summary.recoveredStale += 1;
    switch (outcome.outcome) {
      case "sent":
        summary.sent += 1;
        summary.dispatchRowsWritten += 1;
        break;
      case "skipped":
        summary.dispatchRowsWritten += 1;
        if (outcome.reason === "no_birthday") summary.skippedNoBirthday += 1;
        else if (outcome.reason === "invalid_email") summary.skippedInvalidEmail += 1;
        else summary.skippedAlreadySent += 1;
        break;
      default:
        summary.failed += 1;
        summary.lastError = outcome.reason ?? "unknown";
    }

    if (row.push_enabled) {
      await runPushForUser({
        supabase,
        userId: row.user_id,
        now,
        outcome,
        sendPush: sendPushNotification
      });
    }
  }

  const showDebug = process.env.NODE_ENV !== "production" || xDebug;
  const body: Record<string, unknown> = { ok: true, ...summary };
  if (showDebug) {
    const debug: Record<string, unknown> = {
      serverNowIso,
      serverNowUtc,
      scannedUsers: summary.scannedUsers,
      candidates: summary.candidates,
      insertsAttempted: summary.insertsAttempted,
      dispatchRowsWritten: summary.dispatchRowsWritten,
      lastError: summary.lastError ?? undefined,
      forcedUserId: debugUserId ?? undefined,
      forced: forceCandidate,
      skipReasons: skipReasons.length ? skipReasons : undefined
    };
    if (rows.length === 1) {
      const row = rows[0];
      const tz = (row.timezone || "America/Sao_Paulo").trim();
      const parts = getDatePartsInTimeZone(tz, now);
      const dateKey = getDateKey(now, tz);
      const { day, month } = dateKeyToDayMonth(dateKey);
      const birthdaysResult = await deps.getBirthdays(row.user_id, day, month);
      debug.todayInUserTz = parts.isoDate;
      debug.nowInUserTz = parts.hhmm;
      debug.birthdaysFoundForToday = Array.isArray(birthdaysResult) ? birthdaysResult.length : 0;
    }
    body.debug = debug;
  }
  return NextResponse.json(body);
}
