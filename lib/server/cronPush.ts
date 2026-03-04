import type { ProcessOutcome } from "@/lib/server/dailyEmailCronLogic";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { sendPushNotification } from "@/lib/server/push";

export type RunPushDeps = {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  userId: string;
  now: Date;
  sendPush?: (
    subRow: { endpoint: string; p256dh: string; auth: string },
    payload: { title: string; body: string; url?: string }
  ) => Promise<{ ok: boolean; invalidEndpoint?: boolean }>;
  outcome?: ProcessOutcome;
};

export type RunPushResult =
  | { attempted: false; reason: "no_subscription" }
  | { attempted: true; sent: false; reason: "send_failed" }
  | { attempted: true; sent: false; revoked: true; reason: "invalid_endpoint" }
  | { attempted: true; sent: true };

export async function runPushForUser(deps: RunPushDeps): Promise<RunPushResult> {
  const { supabase, userId, now, outcome, sendPush = sendPushNotification } = deps;
  try {
    const { data: sub } = await supabase
      .from("push_subscriptions" as "user_settings")
      .select("endpoint,p256dh,auth")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const subRow = sub as { endpoint: string; p256dh: string; auth: string } | null;
    if (!subRow) return { attempted: false, reason: "no_subscription" };

    const body =
      outcome && outcome.outcome === "sent"
        ? "Hoje tem aniversário! Abra o app."
        : "Hoje tem aniversário no Lembra.";
    const payload = { title: "Lembra", body, url: "/today" as const };

    const pushRes = await sendPush(subRow, payload);

    if (!pushRes.ok && pushRes.invalidEndpoint) {
      await (supabase.from("push_subscriptions" as "user_settings") as ReturnType<typeof supabase.from>)
        .update({ revoked_at: now.toISOString() } as never)
        .eq("endpoint", subRow.endpoint);
      return { attempted: true, sent: false, revoked: true, reason: "invalid_endpoint" };
    }
    if (pushRes.ok) return { attempted: true, sent: true };
    return { attempted: true, sent: false, reason: "send_failed" };
  } catch (_) {
    return { attempted: true, sent: false, reason: "send_failed" };
  }
}
