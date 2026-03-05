"use client";

import { getSafeBrowserSession, getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  DEFAULT_EMAIL_REMINDER_SETTINGS,
  type EmailReminderSettings,
  type LastEmailDispatch,
  type PushSettings
} from "@/lib/types";

export function isValidTimezone(tz: string): boolean {
  if (!tz || typeof tz !== "string") return false;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

type UserSettingsRow = {
  user_id: string;
  email_enabled?: boolean | null;
  email_time?: string | null;
  timezone?: string | null;
  last_daily_email_sent_on?: string | null;
  push_enabled?: boolean | null;
};

function normalizeEmailTime(value?: string | null) {
  if (!value) return DEFAULT_EMAIL_REMINDER_SETTINGS.emailTime;
  return /^\d{2}:\d{2}$/.test(value) ? value : DEFAULT_EMAIL_REMINDER_SETTINGS.emailTime;
}

function normalizeSettings(row?: UserSettingsRow | null): EmailReminderSettings {
  return {
    emailEnabled: Boolean(row?.email_enabled ?? DEFAULT_EMAIL_REMINDER_SETTINGS.emailEnabled),
    emailTime: normalizeEmailTime(row?.email_time),
    timezone: row?.timezone || DEFAULT_EMAIL_REMINDER_SETTINGS.timezone,
    lastDailyEmailSentOn: row?.last_daily_email_sent_on ?? null
  };
}

export function normalizePushSettings(row?: UserSettingsRow | null): PushSettings {
  return {
    pushEnabled: Boolean(row?.push_enabled ?? false)
  };
}

async function getCurrentUserId() {
  const { session } = await getSafeBrowserSession();
  return session?.user?.id ?? null;
}

export async function getEmailReminderSettings(): Promise<EmailReminderSettings | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_settings")
    .select("user_id,email_enabled,email_time,timezone,last_daily_email_sent_on,push_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[notifications] remote settings read failed:", error.message);
    }
    return null;
  }

  return normalizeSettings((data as UserSettingsRow | null) ?? null);
}

export async function saveEmailReminderSettings(partial: Partial<EmailReminderSettings>): Promise<EmailReminderSettings | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const current = (await getEmailReminderSettings()) ?? { ...DEFAULT_EMAIL_REMINDER_SETTINGS };
  const next: EmailReminderSettings = {
    ...current,
    ...partial,
    emailTime:
      partial.emailTime !== undefined ? normalizeEmailTime(partial.emailTime) : (current.emailTime ?? DEFAULT_EMAIL_REMINDER_SETTINGS.emailTime),
    timezone: partial.timezone !== undefined ? partial.timezone : (current.timezone ?? DEFAULT_EMAIL_REMINDER_SETTINGS.timezone)
  };

  // Always persist full email state so upsert never leaves email_time/timezone to DB default (avoids reset to 09:00 when only toggling enabled)
  const payload = buildEmailReminderPayloadFromFull(next, userId);
  await upsertUserSettingsEmail(supabase as unknown as Parameters<typeof upsertUserSettingsEmail>[0], payload);
  return next;
}

/** Builds DB payload with only keys present in partial (patch). Exported for unit tests. */
export function buildEmailReminderPayload(
  partial: Partial<EmailReminderSettings>,
  userId: string
): Record<string, unknown> {
  const payload: Record<string, unknown> = { user_id: userId };
  if (partial.emailEnabled !== undefined) payload.email_enabled = partial.emailEnabled;
  if (partial.emailTime !== undefined) payload.email_time = normalizeEmailTime(partial.emailTime);
  if (partial.timezone !== undefined) payload.timezone = partial.timezone;
  return payload;
}

/** Full payload for upsert so email_time/timezone are never left to DB default when toggling email_enabled. */
function buildEmailReminderPayloadFromFull(settings: EmailReminderSettings, userId: string): Record<string, unknown> {
  return {
    user_id: userId,
    email_enabled: settings.emailEnabled,
    email_time: normalizeEmailTime(settings.emailTime),
    timezone: settings.timezone ?? DEFAULT_EMAIL_REMINDER_SETTINGS.timezone
  };
}

/** Used by saveEmailReminderSettings; exported for unit tests. Throws on DB error. */
export async function upsertUserSettingsEmail(
  supabase: {
    from: (table: string) => {
      upsert: (p: unknown, opts: { onConflict: string }) => Promise<{ error: { message: string } | null }>;
    };
  },
  payload: Record<string, unknown>
): Promise<void> {
  const result = await supabase.from("user_settings").upsert(payload, { onConflict: "user_id" });
  const error = (result as { error: { message: string } | null }).error;
  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[notifications] remote settings save failed:", error.message);
    }
    throw new Error(error.message || "Falha ao salvar configurações de email.");
  }
}

export async function getLastEmailDispatch(): Promise<LastEmailDispatch> {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("daily_email_dispatch")
    .select("date_key, status, sent_at, error_message")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    dateKey: (data as { date_key: string }).date_key,
    status: (data as { status: string }).status,
    sentAt: (data as { sent_at: string | null }).sent_at ?? null,
    errorMessage: (data as { error_message: string | null }).error_message ?? null
  };
}

export async function getPushSettings(): Promise<PushSettings | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("user_settings")
    .select("push_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return { pushEnabled: false };
  return normalizePushSettings(data as UserSettingsRow);
}

export async function savePushEnabled(enabled: boolean): Promise<PushSettings | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { error } = await supabase.from("user_settings").upsert(
    { user_id: userId, push_enabled: enabled },
    { onConflict: "user_id" }
  );
  if (error) return null;
  return { pushEnabled: enabled };
}
