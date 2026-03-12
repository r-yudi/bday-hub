#!/usr/bin/env node
/**
 * Chama o cron em modo read-only (dry-run + diagnostic e opcionalmente por userId)
 * para colar o JSON no relatório de validação. Não altera estado.
 *
 * Uso:
 *   CRON_SECRET=xxx node scripts/validate-cron-email.mjs
 *   CRON_SECRET=xxx CRON_TEST_USER_ID=uuid node scripts/validate-cron-email.mjs
 *   BASE_URL=https://uselembra.com.br (default)
 */

const CRON_SECRET = process.env.CRON_SECRET;
const CRON_TEST_USER_ID = process.env.CRON_TEST_USER_ID?.trim();
const BASE_URL = (process.env.BASE_URL || "https://uselembra.com.br").replace(/\/$/, "");

if (!CRON_SECRET) {
  console.error("Defina CRON_SECRET no ambiente.");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${CRON_SECRET}` };

async function main() {
  console.log("--- Dry-run + diagnostic (read-only) ---\n");
  const dryRunRes = await fetch(`${BASE_URL}/api/cron/email?dry-run=true&diagnostic=1`, { headers });
  const dryRunJson = await dryRunRes.json();
  console.log(JSON.stringify(dryRunJson, null, 2));
  console.log("\n--- Fim dry-run ---\n");

  if (CRON_TEST_USER_ID) {
    console.log("--- Diagnóstico por usuário de teste (read-only) ---\n");
    const userRes = await fetch(
      `${BASE_URL}/api/cron/email?diagnostic=1&userId=${encodeURIComponent(CRON_TEST_USER_ID)}`,
      { headers }
    );
    const userJson = await userRes.json();
    console.log(JSON.stringify(userJson, null, 2));
    console.log("\n--- Fim diagnóstico usuário ---");
  } else {
    console.log("(Opcional: defina CRON_TEST_USER_ID para incluir diagnóstico por usuário.)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
