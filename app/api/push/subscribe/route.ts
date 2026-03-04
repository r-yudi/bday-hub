import { NextResponse } from "next/server";
import { getUserIdFromBearerToken } from "@/lib/server/supabase-api-auth";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";
import { validateSubscribeBody } from "@/lib/server/push-subscribe-validation";

export async function POST(request: Request) {
  const userId = await getUserIdFromBearerToken(request);
  if (!userId) {
    return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "invalid-json" }, { status: 400 });
  }
  if (!validateSubscribeBody(body)) {
    return NextResponse.json({ ok: false, message: "invalid-payload" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const row = {
    user_id: userId,
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
    revoked_at: null
  };

  const insertRes = await (supabase.from("push_subscriptions" as "user_settings") as ReturnType<typeof supabase.from>)
    .insert(row as never)
    .select("id")
    .maybeSingle();

  const ins = insertRes as { data?: { id: string } | null; error?: { code: string } };
  if (ins.error?.code === "23505") {
    const existing = await (supabase.from("push_subscriptions" as "user_settings") as ReturnType<typeof supabase.from>)
      .select("user_id")
      .eq("endpoint", body.endpoint)
      .maybeSingle();
    const data = (existing as { data?: { user_id: string } | null }).data;
    if (data?.user_id === userId) {
      await (supabase.from("push_subscriptions" as "user_settings") as ReturnType<typeof supabase.from>)
        .update({ p256dh: body.keys.p256dh, auth: body.keys.auth, revoked_at: null } as never)
        .eq("endpoint", body.endpoint);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json(
      { ok: false, message: "endpoint-already-used" },
      { status: 409 }
    );
  }
  if (ins.error) {
    return NextResponse.json({ ok: false, message: ins.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
