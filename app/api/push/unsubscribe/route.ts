import { NextResponse } from "next/server";
import { getUserIdFromBearerToken } from "@/lib/server/supabase-api-auth";
import { getSupabaseAdminClient } from "@/lib/server/supabase-admin";

export async function POST(request: Request) {
  const userId = await getUserIdFromBearerToken(request);
  if (!userId) {
    return NextResponse.json({ ok: false, message: "unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  await (supabase.from("push_subscriptions" as "user_settings") as ReturnType<typeof supabase.from>)
    .update({ revoked_at: now } as never)
    .eq("user_id", userId);

  return NextResponse.json({ ok: true });
}
