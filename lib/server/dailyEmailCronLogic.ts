/**
 * Daily email cron helpers and idempotent process-one-user logic.
 * Exported for use in route and unit tests (mocked deps).
 */

import { getDateKey } from "@/lib/timezone";
import { buildDailyReminderEmail, getDatePartsInTimeZone } from "@/lib/server/dailyReminderDigest";

export const STALE_PENDING_MS = 2 * 60 * 60 * 1000;
export const MAX_ERROR_MESSAGE_LENGTH = 200;

export type UserSettingsReminderRow = {
  user_id: string;
  email_enabled: boolean;
  email_time: string | null;
  timezone: string | null;
  push_enabled?: boolean;
};

export type BirthdayRow = { name: string; day: number; month: number };

export type DispatchRow = {
  id: string;
  user_id: string;
  date_key: string;
  status: string;
  created_at: string;
};

export function dateKeyToDayMonth(dateKey: string): { day: number; month: number } {
  const parts = dateKey.split("-");
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  return { day: Number.isInteger(day) ? day : 1, month: Number.isInteger(month) ? month : 1 };
}

export function truncateError(msg: string): string {
  if (msg.length <= MAX_ERROR_MESSAGE_LENGTH) return msg;
  return msg.slice(0, MAX_ERROR_MESSAGE_LENGTH - 3) + "...";
}

const MINUTES_PER_DAY = 24 * 60;

function toMinutes(hhmm: string): number | null {
  const trimmed = (hhmm ?? "").trim();
  if (!trimmed) return null;
  const [hourText, minuteText] = trimmed.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText ?? "0");
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

/**
 * Janela de envio: [email_time, email_time + cronIntervalMinutes) no timezone do usuário.
 * Trata virada do dia (ex.: 23:50 -> janela até 00:05).
 */
export function shouldSendNow(
  nowUtc: Date,
  timezone: string,
  emailTime: string,
  cronIntervalMinutes = 15
): boolean {
  const parts = getDatePartsInTimeZone(timezone, nowUtc);
  const currentMinutes = toMinutes(parts.hhmm);
  const targetMinutes = toMinutes(emailTime.trim());
  if (currentMinutes === null || targetMinutes === null) return false;
  const windowEnd = targetMinutes + cronIntervalMinutes;
  if (windowEnd <= MINUTES_PER_DAY) {
    return currentMinutes >= targetMinutes && currentMinutes < windowEnd;
  }
  // Janela cruza meia-noite (ex.: 23:50 + 15 = 00:05)
  return currentMinutes >= targetMinutes || currentMinutes < windowEnd % MINUTES_PER_DAY;
}

export function shouldSendForNow(emailTime: string, timezone: string, now = new Date()): boolean {
  return shouldSendNow(now, timezone, (emailTime ?? "").trim(), 15);
}

export type CandidateDebug = {
  email_enabled: boolean;
  email_time: string;
  timezone: string;
  localNow: string;
  localNowHHMM: string;
  emailTimeParsed: number | null;
  windowStart: string;
  windowEnd: string;
  isCandidate: boolean;
  reasonIfNot?: string;
};

/**
 * Avalia um usuário para o cron e retorna dados de debug (para X-Debug e ?userId=).
 */
export function getCandidateDebug(
  row: UserSettingsReminderRow,
  now: Date,
  cronIntervalMinutes = 15
): CandidateDebug {
  const timezone = (row.timezone || "America/Sao_Paulo").trim();
  const emailTime = (row.email_time || "09:00").trim();
  const parts = getDatePartsInTimeZone(timezone, now);
  const currentMinutes = toMinutes(parts.hhmm);
  const targetMinutes = toMinutes(emailTime);
  const formatM = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const windowEndMinutes = targetMinutes !== null ? targetMinutes + cronIntervalMinutes : null;
  const windowEndM =
    windowEndMinutes !== null && windowEndMinutes >= MINUTES_PER_DAY ? windowEndMinutes % MINUTES_PER_DAY : windowEndMinutes;
  const windowStart = targetMinutes !== null ? formatM(targetMinutes) : "invalid";
  const windowEnd =
    windowEndM !== null ? formatM(windowEndM) : "invalid";

  let isCandidate = false;
  let reasonIfNot: string | undefined;
  if (!row.email_enabled) {
    reasonIfNot = "email_enabled is false";
  } else if (targetMinutes === null) {
    reasonIfNot = `email_time "${emailTime}" could not be parsed (expected HH:MM)`;
  } else if (currentMinutes === null) {
    reasonIfNot = "could not parse local time";
  } else {
    isCandidate = shouldSendNow(now, timezone, emailTime, cronIntervalMinutes);
    if (!isCandidate) {
      const windowEndVal = targetMinutes + cronIntervalMinutes;
      if (windowEndVal <= MINUTES_PER_DAY) {
        reasonIfNot = `local time ${parts.hhmm} not in [${windowStart}, ${windowEnd})`;
      } else {
        reasonIfNot = `local time ${parts.hhmm} not in [${windowStart}, 24:00) or [00:00, ${windowEnd})`;
      }
    }
  }

  return {
    email_enabled: row.email_enabled,
    email_time: emailTime,
    timezone,
    localNow: `${parts.isoDate} ${parts.hhmm}`,
    localNowHHMM: parts.hhmm,
    emailTimeParsed: targetMinutes,
    windowStart,
    windowEnd,
    isCandidate,
    ...(reasonIfNot && { reasonIfNot })
  };
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export type ProcessOutcome =
  | { outcome: "sent"; recoveredStale?: boolean }
  | {
      outcome: "skipped";
      reason: "no_birthday" | "already_sent" | "already_processing" | "invalid_email";
      recoveredStale?: boolean;
    }
  | { outcome: "failed"; reason: string };

export type DailyEmailCronDeps = {
  insertDispatch: (userId: string, dateKey: string) => Promise<{ id: string } | { error: string; code?: string }>;
  getExistingDispatch: (userId: string, dateKey: string) => Promise<DispatchRow | null>;
  /** Atomic claim of stale pending row; returns true if this process claimed it. */
  claimStalePending: (id: string, now: Date) => Promise<boolean>;
  updateDispatch: (id: string, update: { status: string; error_message?: string; sent_at?: string }) => Promise<void>;
  getBirthdays: (userId: string, day: number, month: number) => Promise<BirthdayRow[] | { error: string }>;
  getUserEmail: (userId: string) => Promise<string | null>;
  sendReminderEmail: (input: { to: string; subject: string; html: string; text: string }) => Promise<{ ok: true } | { ok: false; reason?: string; detail?: string }>;
};

export type ProcessOneCandidateOptions = {
  /** When set, store this in error_message when status is skipped (no birthdays). Used for forced debug runs. */
  debugNoBirthdaysMessage?: string;
};

/**
 * Process one candidate: insert-first claim, then skip or send.
 * Injects all I/O via deps for testability.
 */
export async function processOneCandidate(
  deps: DailyEmailCronDeps,
  row: UserSettingsReminderRow,
  now: Date,
  options?: ProcessOneCandidateOptions
): Promise<ProcessOutcome> {
  const timezone = row.timezone || "America/Sao_Paulo";
  const emailTime = row.email_time || "09:00";
  const dateKey = getDateKey(now, timezone);

  const insertResult = await deps.insertDispatch(row.user_id, dateKey);
  let dispatchId: string | null = null;
  let recoveredStale = false;

  if ("error" in insertResult) {
    if (insertResult.code === "23505") {
      const existingRow = await deps.getExistingDispatch(row.user_id, dateKey);
      if (!existingRow) return { outcome: "failed", reason: "existing-row-missing" };
      if (existingRow.status !== "pending") return { outcome: "skipped", reason: "already_sent" };
      const createdAt = new Date(existingRow.created_at).getTime();
      if (now.getTime() - createdAt < STALE_PENDING_MS) return { outcome: "skipped", reason: "already_sent" };
      const claimed = await deps.claimStalePending(existingRow.id, now);
      if (!claimed) return { outcome: "skipped", reason: "already_processing" };
      dispatchId = existingRow.id;
      recoveredStale = true;
    } else {
      return { outcome: "failed", reason: insertResult.error };
    }
  } else {
    dispatchId = insertResult.id;
  }

  if (!dispatchId) return { outcome: "failed", reason: "no-dispatch-id" };

  const { day, month } = dateKeyToDayMonth(dateKey);
  const birthdaysResult = await deps.getBirthdays(row.user_id, day, month);
  if (!Array.isArray(birthdaysResult)) {
    await deps.updateDispatch(dispatchId, { status: "error", error_message: truncateError(birthdaysResult.error) });
    return { outcome: "failed", reason: birthdaysResult.error };
  }

  const birthdays = birthdaysResult;
  if (birthdays.length === 0) {
    await deps.updateDispatch(dispatchId, {
      status: "skipped",
      ...(options?.debugNoBirthdaysMessage && { error_message: options.debugNoBirthdaysMessage })
    });
    return { outcome: "skipped", reason: "no_birthday", ...(recoveredStale && { recoveredStale: true }) };
  }

  const to = await deps.getUserEmail(row.user_id);
  if (!to || !isValidEmail(to)) {
    await deps.updateDispatch(dispatchId, { status: "error", error_message: "invalid-or-missing-email" });
    return { outcome: "skipped", reason: "invalid_email" };
  }

  const digest = buildDailyReminderEmail(birthdays);
  const sent = await deps.sendReminderEmail({ to, subject: digest.subject, html: digest.html, text: digest.text });

  if (!sent.ok) {
    const errMsg = sent.reason === "provider-error" && sent.detail ? truncateError(sent.detail) : sent.reason ?? "send-failed";
    await deps.updateDispatch(dispatchId, { status: "error", error_message: errMsg });
    return { outcome: "failed", reason: errMsg };
  }

  await deps.updateDispatch(dispatchId, { status: "sent", sent_at: now.toISOString() });
  return { outcome: "sent", ...(recoveredStale && { recoveredStale: true }) };
}
