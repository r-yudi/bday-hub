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
  type ProcessOutcome,
  type UserSettingsReminderRow,
  type DailyEmailCronDeps,
  type BirthdayRow,
  type DispatchRow
} from "@/lib/server/dailyEmailCronLogic";
import { getDateKey } from "@/lib/timezone";
import { getDatePartsInTimeZone } from "@/lib/server/dailyReminderDigest";

const CRON_INTERVAL_MINUTES = 15;
const MINUTES_PER_DAY = 24 * 60;

function toMinutes(hhmm: string): number | null {
  const [h, m] = (hhmm ?? "").trim().split(":");
  const hour = Number(h);
  const minute = Number(m ?? "0");
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

function formatHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

type DebugUser = {
  userId: string;
  emailEnabled: boolean;
  emailTime: string;
  timezone: string;
  serverNowUtcIso: string;
  userNowLocalIso: string;
  windowStartLocalIso: string;
  windowEndLocalIso: string;
  isWithinWindow: boolean;
  computedDateKey: string;
  reason?: string;
};

function buildDebugUser(
  row: UserSettingsReminderRow,
  now: Date,
  outcomeOrSkip?: ProcessOutcome | { skipReason: string }
): DebugUser {
  const tz = (row.timezone || "America/Sao_Paulo").trim();
  const emailTime = (row.email_time || "09:00").trim();
  const parts = getDatePartsInTimeZone(tz, now);
  const dateKey = getDateKey(now, tz);
  const targetMinutes = toMinutes(emailTime);
  const windowEndMinutes = targetMinutes !== null ? targetMinutes + CRON_INTERVAL_MINUTES : null;
  const crossesMidnight = windowEndMinutes !== null && windowEndMinutes >= MINUTES_PER_DAY;
  const windowStartLocalIso =
    targetMinutes !== null ? `${parts.isoDate}T${emailTime}:00` : `${parts.isoDate}T00:00:00`;
  const windowEndLocalIso =
    windowEndMinutes !== null
      ? crossesMidnight
        ? `${getDatePartsInTimeZone(tz, new Date(now.getTime() + 86400000)).isoDate}T${formatHHMM(windowEndMinutes)}:00`
        : `${parts.isoDate}T${formatHHMM(windowEndMinutes)}:00`
      : `${parts.isoDate}T00:00:00`;
  const isWithinWindow = shouldSendForNow(emailTime, tz, now);
  let reason: string | undefined;
  if (outcomeOrSkip) {
    if ("skipReason" in outcomeOrSkip) reason = outcomeOrSkip.skipReason === "outside_window" ? "outside_window" : outcomeOrSkip.skipReason;
    else if (outcomeOrSkip.outcome === "skipped") {
      const r = outcomeOrSkip.reason;
      reason = r === "already_sent" || r === "already_processing" ? "already_dispatched" : r === "no_birthday" ? "no_birthdays_today" : r;
    } else if (outcomeOrSkip.outcome === "failed") reason = outcomeOrSkip.reason;
    else if (outcomeOrSkip.outcome === "sent") reason = undefined;
  } else if (!row.email_enabled) reason = "email_disabled";
  else if (!isWithinWindow) reason = "outside_window";
  return {
    userId: row.user_id,
    emailEnabled: row.email_enabled,
    emailTime,
    timezone: tz,
    serverNowUtcIso: now.toISOString(),
    userNowLocalIso: `${parts.isoDate}T${parts.hhmm}:00`,
    windowStartLocalIso,
    windowEndLocalIso,
    isWithinWindow,
    computedDateKey: dateKey,
    ...(reason && { reason })
  };
}

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
    (request.headers.get("x-force") === "1" || request.headers.get("x-debug-force") === "1") &&
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
          scannedUsers: 0,
          candidates: 0,
          insertsAttempted: 0,
          dispatchRowsWritten: 0,
          skippedAlreadySent: 0,
          lastError: undefined,
          debug: {
            serverNowIso,
            serverNowUtc,
            debugUser: null,
            reason: "user_not_found"
          }
        },
        { status: 200 }
      );
    }
    const row = userRow as UserSettingsReminderRow;
    const userDebug = getCandidateDebug(row, now);
    const treatAsCandidate = userDebug.isCandidate || forceCandidate;
    const deps = buildCronDeps(supabase);
    let outcome: ProcessOutcome | undefined;
    let insertsAttempted = 0;
    let dispatchRowsWritten = 0;
    let lastError: string | undefined;
    if (treatAsCandidate) {
      insertsAttempted = 1;
      outcome = await processOneCandidate(
        deps,
        row,
        now,
        forceCandidate ? { debugNoBirthdaysMessage: "forced_debug_no_birthdays" } : undefined
      );
      if (outcome.outcome === "sent") dispatchRowsWritten = 1;
      else if (outcome.outcome === "skipped" && outcome.reason !== "already_sent" && outcome.reason !== "already_processing") dispatchRowsWritten = 1;
      if (outcome.outcome === "failed") lastError = outcome.reason;
    }
    const debugUser = buildDebugUser(row, now, outcome);
    return NextResponse.json({
      ok: true,
      scannedUsers: 1,
      candidates: treatAsCandidate ? 1 : 0,
      insertsAttempted,
      dispatchRowsWritten,
      skippedAlreadySent: outcome?.outcome === "skipped" && outcome.reason !== "no_birthday" && outcome.reason !== "invalid_email" ? 1 : 0,
      lastError,
      debug: {
        serverNowIso,
        serverNowUtc,
        debugUser
      }
    });
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
  let singleUserOutcome: ProcessOutcome | { skipReason: string } | null = null;

  for (const row of rows) {
    const timezone = (row.timezone || "America/Sao_Paulo").trim();
    const emailTime = (row.email_time || "09:00").trim();
    const isInWindow = shouldSendForNow(emailTime, timezone, now);
    const treatAsCandidate =
      isInWindow || (forceCandidate && debugUserId !== null && row.user_id === debugUserId);

    if (!treatAsCandidate) {
      skipReasons.push({ userId: row.user_id, skipReason: "outside_window" });
      if (rows.length === 1) singleUserOutcome = { skipReason: "outside_window" };
      continue;
    }
    summary.candidates += 1;
    summary.insertsAttempted += 1;

    const outcome = await processOneCandidate(
      deps,
      row,
      now,
      forceCandidate ? { debugNoBirthdaysMessage: "forced_debug_no_birthdays" } : undefined
    );
    if (rows.length === 1) singleUserOutcome = outcome;

    if ("recoveredStale" in outcome && outcome.recoveredStale) summary.recoveredStale += 1;
    switch (outcome.outcome) {
      case "sent":
        summary.sent += 1;
        summary.dispatchRowsWritten += 1;
        break;
      case "skipped":
        if (outcome.reason !== "already_sent" && outcome.reason !== "already_processing") {
          summary.dispatchRowsWritten += 1;
        }
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
      skippedAlreadySent: summary.skippedAlreadySent,
      lastError: summary.lastError ?? undefined,
      forcedUserId: debugUserId ?? undefined,
      forced: forceCandidate,
      skipReasons: skipReasons.length ? skipReasons : undefined
    };
    if (rows.length === 1) {
      debug.debugUser = buildDebugUser(rows[0], now, singleUserOutcome ?? undefined);
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
