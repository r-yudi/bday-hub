import { NextResponse } from "next/server";
import { sendReminderEmail } from "@/lib/server/email";
import { runPushForUser } from "@/lib/server/cronPush";
import { sendPushNotification } from "@/lib/server/push";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import {
  processOneCandidate,
  shouldSendForNow,
  STALE_PENDING_MS,
  type UserSettingsReminderRow,
  type DailyEmailCronDeps,
  type BirthdayRow,
  type DispatchRow
} from "@/lib/server/dailyEmailCronLogic";

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
  const deps = buildCronDeps(supabase);
  const summary = {
    scannedUsers: 0,
    candidates: 0,
    sent: 0,
    skippedNoBirthday: 0,
    skippedAlreadySent: 0,
    skippedInvalidEmail: 0,
    failed: 0,
    recoveredStale: 0
  };

  const { data: settingsRows, error: settingsError } = await supabase
    .from("user_settings")
    .select("user_id,email_enabled,email_time,timezone,push_enabled")
    .eq("email_enabled", true);

  if (settingsError) {
    return NextResponse.json({ ok: false, message: settingsError.message }, { status: 500 });
  }

  const rows = (settingsRows ?? []) as UserSettingsReminderRow[];
  summary.scannedUsers = rows.length;

  for (const row of rows) {
    const timezone = row.timezone || "America/Sao_Paulo";
    const emailTime = row.email_time || "09:00";
    if (!shouldSendForNow(emailTime, timezone, now)) continue;
    summary.candidates += 1;

    const outcome = await processOneCandidate(deps, row, now);

    if ("recoveredStale" in outcome && outcome.recoveredStale) summary.recoveredStale += 1;
    switch (outcome.outcome) {
      case "sent":
        summary.sent += 1;
        break;
      case "skipped":
        if (outcome.reason === "no_birthday") summary.skippedNoBirthday += 1;
        else if (outcome.reason === "invalid_email") summary.skippedInvalidEmail += 1;
        else summary.skippedAlreadySent += 1; // already_sent | already_processing
        break;
      default:
        summary.failed += 1;
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

  return NextResponse.json({ ok: true, ...summary });
}
