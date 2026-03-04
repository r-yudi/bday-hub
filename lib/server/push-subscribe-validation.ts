export type SubscribeBody = { endpoint: string; keys: { p256dh: string; auth: string } };

type Body = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

export function validateSubscribeBody(body: unknown): body is SubscribeBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Body;
  return (
    typeof b.endpoint === "string" &&
    b.endpoint.length > 0 &&
    b.keys != null &&
    typeof b.keys === "object" &&
    typeof (b.keys as { p256dh?: string }).p256dh === "string" &&
    (b.keys as { p256dh: string }).p256dh.length > 0 &&
    typeof (b.keys as { auth?: string }).auth === "string" &&
    (b.keys as { auth: string }).auth.length > 0
  );
}
