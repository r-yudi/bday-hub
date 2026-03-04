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

function toMinutes(hhmm: string): number | null {
  const [hourText, minuteText] = hhmm.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

/**
 * Janela de envio: [email_time, email_time + cronIntervalMinutes) no timezone do usuário.
 * Sem promessa de horário exato; o cron pode rodar a cada 15 min.
 */
export function shouldSendNow(
  nowUtc: Date,
  timezone: string,
  emailTime: string,
  cronIntervalMinutes = 15
): boolean {
  const parts = getDatePartsInTimeZone(timezone, nowUtc);
  const currentMinutes = toMinutes(parts.hhmm);
  const targetMinutes = toMinutes(emailTime);
  if (currentMinutes === null || targetMinutes === null) return false;
  return currentMinutes >= targetMinutes && currentMinutes < targetMinutes + cronIntervalMinutes;
}

export function shouldSendForNow(emailTime: string, timezone: string, now = new Date()): boolean {
  return shouldSendNow(now, timezone, emailTime, 15);
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

/**
 * Process one candidate: insert-first claim, then skip or send.
 * Injects all I/O via deps for testability.
 */
export async function processOneCandidate(
  deps: DailyEmailCronDeps,
  row: UserSettingsReminderRow,
  now: Date
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
    await deps.updateDispatch(dispatchId, { status: "skipped" });
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
