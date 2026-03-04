import webpush from "web-push";

let vapidConfigured = false;

function getVapidKeys() {
  const publicKey = process.env.VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:support@uselembra.com.br";
  return { publicKey, privateKey, subject };
}

function ensureVapid() {
  if (vapidConfigured) return true;
  const { publicKey, privateKey, subject } = getVapidKeys();
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export type PushSubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type SendPushResult = { ok: true } | { ok: false; reason: string; invalidEndpoint?: boolean };

export async function sendPushNotification(
  subscription: PushSubscriptionRow,
  payload: { title: string; body: string; url?: string }
): Promise<SendPushResult> {
  if (!ensureVapid()) return { ok: false, reason: "vapid-not-configured" };
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    };
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url ?? "/today"
      }),
      { TTL: 60 }
    );
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const invalidEndpoint = isInvalidEndpointError(msg);
    return { ok: false, reason: msg, invalidEndpoint };
  }
}

export function isInvalidEndpointError(message: string): boolean {
  return (
    message.includes("410") ||
    message.includes("404") ||
    message.includes("Gone") ||
    message.includes("Not Found") ||
    message.includes("invalid subscription")
  );
}
