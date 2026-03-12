/**
 * Seed fixtures for cron email testing in production.
 * Run locally with: CRON_TEST_USER_ID=<uuid> SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... npx tsx scripts/seed-cron-test-fixtures.ts
 * Requires the test user to already exist in auth.users (e.g. signed up via the app).
 */

const TZ = "America/Sao_Paulo";

function getDatePartsInTz(date: Date): { day: number; month: number; year: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day"))
  };
}

function addDays(date: Date, n: number): Date {
  const out = new Date(date);
  out.setUTCDate(out.getUTCDate() + n);
  return out;
}

async function main() {
  const userId = process.env.CRON_TEST_USER_ID;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!userId || !serviceRoleKey || !supabaseUrl) {
    console.error("Missing env: CRON_TEST_USER_ID, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL");
    process.exit(1);
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const now = new Date();
  const todayParts = getDatePartsInTz(now);

  await supabase.from("user_settings").upsert(
    {
      user_id: userId,
      email_enabled: true,
      email_time: "09:00",
      timezone: TZ
    },
    { onConflict: "user_id" }
  );
  console.log("user_settings upserted (email_enabled=true, email_time=09:00, timezone=America/Sao_Paulo)");

  const toInsert: { name: string; day: number; month: number }[] = [
    { name: "Teste Hoje", day: todayParts.day, month: todayParts.month },
    { name: "Teste Amanhã", day: getDatePartsInTz(addDays(now, 1)).day, month: getDatePartsInTz(addDays(now, 1)).month }
  ];
  for (let i = 2; i <= 7; i++) {
    const p = getDatePartsInTz(addDays(now, i));
    toInsert.push({ name: `Teste D+${i}`, day: p.day, month: p.month });
  }

  const { data: existing } = await supabase
    .from("birthdays")
    .select("id")
    .eq("user_id", userId)
    .like("name", "Teste%");
  if (existing?.length) {
    for (const row of existing) {
      await supabase.from("birthdays").delete().eq("id", (row as { id: string }).id);
    }
    console.log(`Removed ${existing.length} existing Teste* birthdays`);
  }

  for (const b of toInsert) {
    const { error } = await supabase.from("birthdays").insert({
      user_id: userId,
      name: b.name,
      day: b.day,
      month: b.month,
      source: "manual"
    });
    if (error) {
      console.error("Insert failed:", b, error.message);
    }
  }
  console.log("Inserted", toInsert.length, "birthdays (Teste Hoje, Teste Amanhã, Teste D+2 … D+7)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
