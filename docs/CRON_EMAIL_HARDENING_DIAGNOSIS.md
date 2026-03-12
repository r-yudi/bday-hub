# Diagnóstico: Hardening do email diário

## 1. Problema real

O cron em produção retorna `candidates: 0`, então nenhum usuário entra na janela de envio. O objetivo é identificar a causa com evidência, tornar o fluxo observável (diagnóstico seguro, dry-run read-only), permitir teste real com fixture controlada e alinhar template/docs, sem expandir escopo.

## 2. Por que o fluxo atual não basta

- **Sem diagnóstico em produção:** o objeto `debug` só é retornado quando `NODE_ENV !== "production"` ou `X-Debug: 1`; em produção, chamadas sem X-Debug não mostram breakdown (scannedUsers vs outsideWindow vs candidates, reasonIfNot).
- **Causas possíveis de candidates: 0:**
  1. **scannedUsers = 0** — query `user_settings` com `email_enabled = true` vazia (ninguém ativou no app ou row não existe).
  2. **scannedUsers > 0 e candidates = 0** — todos fora da janela de 15 min no timezone do usuário (`shouldSendForNow` false).
- Não existe **dry-run** read-only (sem envio, sem escrita em dispatch), nem **filtro por userId de teste** controlado (evitar vazar dados de usuários arbitrários).

## 3. Escopo explícito

**Entra:** diagnóstico seguro (diagnostic=1 / X-Debug), dry-run 100% read-only, script interno de fixture para usuário de teste, revisão mínima do template (branding, data, fallback), testes unit e rota (auth + dry-run), documentação (PRD/SPEC/DECISIONS/CRON_SETUP/RUNBOOK) e correção explícita da divergência PRD vs SPEC.

**Não entra:** nova rota admin (preferir script), force-send/X-Force/bypass de janela, painel de diagnóstico, expor email completo, adicionar categorias/blocos ao email, mudar stack ou dedupe.

## 4. Impacto arquitetural

Nenhuma troca de stack. Cron continua GET `/api/cron/email` com CRON_SECRET. service_role apenas no servidor. Dry-run é um ramo read-only na mesma rota (sem insert/update/send). Script de fixture roda local com env (SUPABASE_SERVICE_ROLE_KEY, CRON_TEST_USER_ID).

## 5. Arquivos tocados

- `app/api/cron/email/route.ts` — dry-run, diagnostic, remoção de X-Force, filtro por test user (CRON_TEST_USER_ID), breakdown.
- `lib/server/dailyReminderDigest.ts` — template: branding Lembra., data, fallback.
- `scripts/seed-cron-test-fixtures.ts` — novo script interno.
- Testes em `tests/unit/` e eventual teste da rota.
- `PRD.md`, `SPEC.md`, `docs/CRON_SETUP.md`, `docs/DECISIONS.md`, `docs/RUNBOOK_PRODUCTION.md`.

## 6. Riscos sistêmicos

- **Service role:** só no servidor; não expor no client.
- **Guest/local-first:** cron não altera fluxo local; apenas lê Supabase (user_settings, birthdays, daily_email_dispatch).
- **Vazar dados:** no breakdown não incluir email completo; filtro por userId apenas para CRON_TEST_USER_ID.

## 7. Critérios de aceite

- Causa de candidates: 0 identificada com evidência (scannedUsers/outsideWindow no breakdown).
- Breakdown seguro em produção (diagnostic=1 ou X-Debug com CRON_SECRET).
- Dry-run estritamente read-only (sem envio, sem escrita em dispatch).
- Script interno de fixture para usuário de teste (hoje, amanhã, próximos 7 dias).
- Teste real com aniversariante hoje; dedupe e timezone America/Sao_Paulo cobertos.
- Template minimamente aderente ao Lembra; build/tests/smoke passando; guest/local-first intacto.
