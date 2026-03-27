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
import { FALLBACK_TZ, getDateKey } from "@/lib/timezone";
import { getDatePartsInTimeZone } from "@/lib/server/dailyReminderDigest";

const CRON_INTERVAL_MINUTES = 15;
const MINUTES_PER_DAY = 24 * 60;

function isTruthy(v: string | null | undefined): boolean {
  if (!v) return false;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

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
  forced: boolean;
  forcedOverrideWindow: boolean;
  reason?: string;
};

function buildDebugUser(
  row: UserSettingsReminderRow,
  now: Date,
  outcomeOrSkip?: ProcessOutcome | { skipReason: string },
  options?: { forced?: boolean }
): DebugUser {
  const tz = (row.timezone || FALLBACK_TZ).trim();
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
  const forced = options?.forced ?? false;
  const forcedOverrideWindow = forced && !isWithinWindow;
  let reason: string | undefined;
  if (outcomeOrSkip) {
    if ("skipReason" in outcomeOrSkip) {
      reason =
        forcedOverrideWindow ? "forced_override_window" : outcomeOrSkip.skipReason === "outside_window" ? "outside_window" : outcomeOrSkip.skipReason;
    } else if (outcomeOrSkip.outcome === "skipped") {
      const r = outcomeOrSkip.reason;
      reason = r === "already_sent" || r === "already_processing" ? "already_dispatched" : r === "no_birthday" ? "no_birthdays_today" : r;
    } else if (outcomeOrSkip.outcome === "failed") reason = outcomeOrSkip.reason;
    else if (outcomeOrSkip.outcome === "sent") reason = undefined;
  } else if (!row.email_enabled) reason = "email_disabled";
  else if (forcedOverrideWindow) reason = "forced_override_window";
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
    forced,
    forcedOverrideWindow,
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

/** Allowed user IDs for single-user diagnostic/filter (env CRON_TEST_USER_ID, comma-separated). */
function getAllowedTestUserIds(): string[] {
  const raw = process.env.CRON_TEST_USER_ID;
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function buildCronDeps(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  now: Date
): DailyEmailCronDeps {
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
    async claimStalePending(id: string, nowDate: Date) {
      const cutoff = new Date(nowDate.getTime() - STALE_PENDING_MS).toISOString();
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
    sendReminderEmail,
    async pushRunner(userId: string) {
      const result = await runPushForUser({
        supabase,
        userId,
        now,
        sendPush: sendPushNotification
      });
      return { sent: result.attempted && "sent" in result && result.sent === true };
    }
  };
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const now = new Date();
  const url = new URL(request.url);
  const xDebug = isTruthy(request.headers.get("x-debug"));
  const diagnosticParam = url.searchParams.get("diagnostic")?.toLowerCase() ?? "";
  const diagnostic = xDebug || diagnosticParam === "1" || diagnosticParam === "true" || diagnosticParam === "yes";
  const dryRun = url.searchParams.get("dry-run") === "true";
  const allowedTestIds = getAllowedTestUserIds();
  const debugUserId = (request.headers.get("x-debug-userid") ?? request.headers.get("x-debug-user-id"))?.trim() || null;
  const userIdParam = url.searchParams.get("userId");
  const effectiveTestUserId =
    (userIdParam && allowedTestIds.includes(userIdParam) ? userIdParam : null) ||
    (debugUserId && allowedTestIds.includes(debugUserId) ? debugUserId : null);
  const xReset = isTruthy(request.headers.get("x-debug-reset"));
  const serverNowIso = now.toISOString();
  const serverNowUtc = now.toUTCString();

  if (diagnostic && effectiveTestUserId) {
    const { data: userRow, error: userError } = await supabase
      .from("user_settings")
      .select("user_id,email_enabled,email_time,timezone,push_enabled")
      .eq("user_id", effectiveTestUserId)
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
          alreadyDispatchedCount: 0,
          lastError: undefined,
          debug: {
            serverNowIso,
            serverNowUtc,
            debugUser: null,
            reason: "user_not_found",
            reset: { attempted: false, deletedCount: 0 }
          }
        },
        { status: 200 }
      );
    }
    const row = userRow as UserSettingsReminderRow;
    const tzForReset = (row.timezone || FALLBACK_TZ).trim();
    const computedDateKey = getDateKey(now, tzForReset);
    let resetAttempted = false;
    let resetDeletedCount = 0;
    if (!dryRun && xReset) {
      resetAttempted = true;
      const { data: deleted, error: delError } = await supabase
        .from("daily_email_dispatch" as "user_settings")
        .delete()
        .eq("user_id", row.user_id)
        .eq("date_key", computedDateKey)
        .select("id");
      if (!delError && Array.isArray(deleted)) resetDeletedCount = deleted.length;
    }
    const userDebug = getCandidateDebug(row, now);
    const treatAsCandidate = userDebug.isCandidate;
    const debugUser = buildDebugUser(row, now, undefined);
    let outcome: ProcessOutcome | undefined;
    let insertsAttempted = 0;
    let dispatchRowsWritten = 0;
    let lastError: string | undefined;
    let alreadyDispatchedCount = 0;
    if (treatAsCandidate && !dryRun) {
      const deps = buildCronDeps(supabase, now);
      insertsAttempted = 1;
      outcome = await processOneCandidate(deps, row, now);
      if (outcome.outcome === "sent") dispatchRowsWritten = 1;
      else if (outcome.outcome === "skipped" && outcome.reason !== "already_sent" && outcome.reason !== "already_processing") dispatchRowsWritten = 1;
      if (outcome.outcome === "failed") lastError = outcome.reason;
      alreadyDispatchedCount =
        outcome.outcome === "skipped" && (outcome.reason === "already_sent" || outcome.reason === "already_processing") ? 1 : 0;
      Object.assign(debugUser, buildDebugUser(row, now, outcome));
    } else if (treatAsCandidate && dryRun) {
      const table = () => supabase.from("daily_email_dispatch" as "user_settings");
      const existing = await (table() as ReturnType<typeof supabase.from>)
        .select("id, status, created_at")
        .eq("user_id", row.user_id)
        .eq("date_key", computedDateKey)
        .maybeSingle();
      const data = existing.data as DispatchRow | null;
      if (data?.status && data.status !== "pending") outcome = { outcome: "skipped", reason: "already_sent" };
      else if (data?.status === "pending") outcome = { outcome: "skipped", reason: "already_processing" };
      else {
        const { day, month } = dateKeyToDayMonth(computedDateKey);
        const bd = await supabase.from("birthdays").select("name,day,month").eq("user_id", row.user_id).eq("day", day).eq("month", month);
        const to = (await supabase.auth.admin.getUserById(row.user_id)).data.user?.email ?? null;
        const hasBirthdays = Array.isArray(bd.data) && bd.data.length > 0;
        const hasValidEmail = typeof to === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to);
        if (!hasBirthdays) outcome = { outcome: "skipped", reason: "no_birthday" };
        else if (!hasValidEmail) outcome = { outcome: "skipped", reason: "invalid_email" };
        else outcome = { outcome: "sent" };
      }
      Object.assign(debugUser, buildDebugUser(row, now, outcome));
    }
    const { day, month } = dateKeyToDayMonth(computedDateKey);
    const birthdaysForToday =
      (await supabase.from("birthdays").select("name,day,month").eq("user_id", row.user_id).eq("day", day).eq("month", month)).data ?? [];
    const debugUserPayload = {
      ...debugUser,
      localNowHHMM: userDebug.localNowHHMM,
      windowStart: userDebug.windowStart,
      windowEnd: userDebug.windowEnd,
      reasonIfNot: userDebug.reasonIfNot,
      birthdaysFoundForToday: birthdaysForToday.length
    };
    return NextResponse.json({
      ok: true,
      dryRun: dryRun,
      scannedUsers: 1,
      candidates: treatAsCandidate ? 1 : 0,
      insertsAttempted,
      dispatchRowsWritten: dryRun ? 0 : (outcome?.outcome === "sent" ? 1 : outcome?.outcome === "skipped" && outcome.reason !== "already_sent" && outcome.reason !== "already_processing" ? 1 : 0),
      skippedAlreadySent: outcome?.outcome === "skipped" && outcome.reason !== "no_birthday" && outcome.reason !== "invalid_email" ? 1 : 0,
      alreadyDispatchedCount,
      lastError,
      debug: {
        serverNowIso,
        serverNowUtc,
        debugUser: debugUserPayload,
        reset: { attempted: resetAttempted, deletedCount: resetDeletedCount }
      }
    });
  }

  const deps = buildCronDeps(supabase, now);
  const summary = {
    scannedUsers: 0,
    outsideWindow: 0,
    candidates: 0,
    sent: 0,
    skippedNoBirthday: 0,
    skippedAlreadySent: 0,
    alreadyDispatchedCount: 0,
    skippedInvalidEmail: 0,
    failed: 0,
    recoveredStale: 0,
    insertsAttempted: 0,
    dispatchRowsWritten: 0,
    lastError: null as string | null
  };
  const skipReasons: { userId: string; skipReason: string }[] = [];
  let resetAttempted = false;
  let resetDeletedCount = 0;

  let rows: UserSettingsReminderRow[];
  if (effectiveTestUserId) {
    const { data: userRow, error: userError } = await supabase
      .from("user_settings")
      .select("user_id,email_enabled,email_time,timezone,push_enabled")
      .eq("user_id", effectiveTestUserId)
      .maybeSingle();
    if (userError) {
      return NextResponse.json({ ok: false, message: userError.message }, { status: 500 });
    }
    rows = userRow ? ([userRow] as UserSettingsReminderRow[]) : [];
  } else {
    const { data: settingsRows, error: settingsError } = await supabase
      .from("user_settings")
      .select("user_id,email_enabled,email_time,timezone,push_enabled")
      .or("email_enabled.eq.true,push_enabled.eq.true");
    if (settingsError) {
      return NextResponse.json({ ok: false, message: settingsError.message }, { status: 500 });
    }
    rows = (settingsRows ?? []) as UserSettingsReminderRow[];
  }
  summary.scannedUsers = rows.length;

  if (!dryRun && diagnostic && effectiveTestUserId && xReset && rows.length > 0) {
    const row0 = rows[0];
    const tz0 = (row0.timezone || FALLBACK_TZ).trim();
    const dateKey0 = getDateKey(now, tz0);
    resetAttempted = true;
    const { data: deleted, error: delError } = await supabase
      .from("daily_email_dispatch" as "user_settings")
      .delete()
      .eq("user_id", effectiveTestUserId)
      .eq("date_key", dateKey0)
      .select("id");
    if (!delError && Array.isArray(deleted)) resetDeletedCount = deleted.length;
  }

  let singleUserOutcome: ProcessOutcome | { skipReason: string } | null = null;

  const tableDispatch = () => supabase.from("daily_email_dispatch" as "user_settings");
  for (const row of rows) {
    const timezone = (row.timezone || FALLBACK_TZ).trim();
    const emailTime = (row.email_time || "09:00").trim();
    const isInWindow = shouldSendForNow(emailTime, timezone, now);
    const treatAsCandidate = isInWindow;

    if (!treatAsCandidate) {
      summary.outsideWindow += 1;
      skipReasons.push({ userId: row.user_id, skipReason: "outside_window" });
      if (rows.length === 1) singleUserOutcome = { skipReason: "outside_window" };
      continue;
    }
    summary.candidates += 1;

    if (dryRun) {
      summary.insertsAttempted += 1;
      const dateKey = getDateKey(now, timezone);
      const { day, month } = dateKeyToDayMonth(dateKey);
      const existing = await (tableDispatch() as ReturnType<typeof supabase.from>)
        .select("id, status, created_at")
        .eq("user_id", row.user_id)
        .eq("date_key", dateKey)
        .maybeSingle();
      const data = existing.data as DispatchRow | null;
      if (data?.status && data.status !== "pending") {
        summary.alreadyDispatchedCount += 1;
        if (rows.length === 1) singleUserOutcome = { outcome: "skipped", reason: "already_sent" };
      } else if (data?.status === "pending") {
        summary.alreadyDispatchedCount += 1;
        if (rows.length === 1) singleUserOutcome = { outcome: "skipped", reason: "already_processing" };
      } else {
        const bd = await supabase.from("birthdays").select("name,day,month").eq("user_id", row.user_id).eq("day", day).eq("month", month);
        const to = (await supabase.auth.admin.getUserById(row.user_id)).data.user?.email ?? null;
        const hasBirthdays = Array.isArray(bd.data) && bd.data.length > 0;
        const hasValidEmail = typeof to === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to);
        if (!hasBirthdays) {
          summary.skippedNoBirthday += 1;
          if (rows.length === 1) singleUserOutcome = { outcome: "skipped", reason: "no_birthday" };
        } else if (!hasValidEmail) {
          summary.skippedInvalidEmail += 1;
          if (rows.length === 1) singleUserOutcome = { outcome: "skipped", reason: "invalid_email" };
        } else {
          summary.sent += 1;
          if (rows.length === 1) singleUserOutcome = { outcome: "sent" };
        }
      }
      continue;
    }

    summary.insertsAttempted += 1;
    const outcome = await processOneCandidate(deps, row, now);
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
        if (outcome.reason === "already_sent" || outcome.reason === "already_processing") {
          summary.alreadyDispatchedCount += 1;
        }
        if (outcome.reason === "no_birthday") summary.skippedNoBirthday += 1;
        else if (outcome.reason === "invalid_email") summary.skippedInvalidEmail += 1;
        else summary.skippedAlreadySent += 1;
        break;
      default:
        summary.failed += 1;
        summary.lastError = outcome.reason ?? "unknown";
    }
  }

  const showDebug = diagnostic;
  const body: Record<string, unknown> = { ok: true, ...summary };
  if (dryRun) body.dryRun = true;
  if (showDebug) {
    const debug: Record<string, unknown> = {
      serverNowIso,
      serverNowUtc,
      scannedUsers: summary.scannedUsers,
      outsideWindow: summary.outsideWindow,
      candidates: summary.candidates,
      insertsAttempted: summary.insertsAttempted,
      dispatchRowsWritten: summary.dispatchRowsWritten,
      skippedAlreadySent: summary.skippedAlreadySent,
      alreadyDispatchedCount: summary.alreadyDispatchedCount,
      lastError: summary.lastError ?? undefined,
      testUserId: effectiveTestUserId ?? undefined,
      skipReasons: skipReasons.length ? skipReasons : undefined,
      reset: { attempted: resetAttempted, deletedCount: resetDeletedCount }
    };
    if (rows.length === 1) {
      const row0 = rows[0];
      const candidateDebug = getCandidateDebug(row0, now);
      const tz0 = (row0.timezone || FALLBACK_TZ).trim();
      const parts0 = getDatePartsInTimeZone(tz0, now);
      const dateKey0 = getDateKey(now, tz0);
      const { day, month } = dateKeyToDayMonth(dateKey0);
      const birthdaysResult = await deps.getBirthdays(row0.user_id, day, month);
      const birthdaysCount = Array.isArray(birthdaysResult) ? birthdaysResult.length : 0;
      debug.todayInUserTz = parts0.isoDate;
      debug.nowInUserTz = parts0.hhmm;
      debug.birthdaysFoundForToday = birthdaysCount;
      debug.debugUser = {
        ...buildDebugUser(row0, now, singleUserOutcome ?? undefined),
        localNowHHMM: candidateDebug.localNowHHMM,
        windowStart: candidateDebug.windowStart,
        windowEnd: candidateDebug.windowEnd,
        reasonIfNot: candidateDebug.reasonIfNot,
        birthdaysFoundForToday: birthdaysCount
      };
    }
    body.debug = debug;
  }
  return NextResponse.json(body);
}

