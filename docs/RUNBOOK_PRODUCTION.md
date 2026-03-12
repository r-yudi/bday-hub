# Runbook de Produção — Lembra (Email primário + Push complementar)

Referência: [Vercel — Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

**Ponto crítico:** A Vercel envia automaticamente `Authorization: Bearer <CRON_SECRET>` nas invocações do cron. O endpoint só deve aceitar se `CRON_SECRET` estiver setado em Production.

---

## Resposta ao arquiteto (BLOQUEIO mínimo)

Para receber a versão final do runbook **sem bifurcação** (trilho único), responda com **duas linhas**:

1. **Deploy de produção hoje é:**  
   - `main auto-deploy` **ou** `branch de produção` (ex.: `production`)?

2. **Supabase prod aplica migrations como:**  
   - `CLI (supabase db push)` **ou** `manual no dashboard` **ou** `integração GitHub`?

**Formato da resposta (cole e preencha):**

```
DEPLOY: main auto-deploy   (ou: branch de produção)
SUPABASE: CLI              (ou: manual no dashboard | integração GitHub)
```

Após responder, o arquiteto devolve a sequência exata do seu setup (sem trilhos A/B).

---

## 0) Congelar o artefato que vai para prod

- Pegue o **commit hash** atual (o que tem Evidence Pack PASS).
- Garanta que esse commit é o que será deployado.

**Critério:** Evidence Pack do commit **PASS** (já está).

---

## 1) Vercel — variáveis de ambiente (produção)

No **Vercel → Project → Settings → Environment Variables**, setar/confirmar em **Production**:

### Obrigatórias (cron/email)

- `CRON_SECRET` (random ≥ 16 chars)
- `RESEND_API_KEY` (ou equivalente real do repo)
- `SUPABASE_SERVICE_ROLE_KEY` (**server only**)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Obrigatórias (push)

- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (a mesma public key)

**Critérios de aceite**

- `/api/cron/email` responde **401** sem `Authorization`/secret.
- Com `Authorization: Bearer <CRON_SECRET>` responde **200**.
- Nenhuma private key aparece no bundle client.

---

## 2) Supabase (prod) — aplicar migrations

Escolha **um** trilho conforme seu setup.

### Trilho A — Supabase CLI (recomendado se vocês já usam CLI)

1. Na máquina com acesso:
   - `supabase link --project-ref <ref-prod>`
2. Aplicar migrations:
   - `supabase db push`

**Verificações pós-migration**

- Existe `daily_email_dispatch` com `UNIQUE(user_id, date_key)`
- `user_settings` tem `push_enabled boolean default false`
- Existe `push_subscriptions` com RLS owner-only

### Trilho B — Manual via Dashboard SQL Editor

1. Dashboard Supabase (prod) → SQL Editor
2. Rodar, em ordem, os arquivos de migration que ainda não estão aplicados:
   - `supabase/migrations/20260227_daily_email_dispatch.sql`
   - `supabase/migrations/20260228_add_push_enabled_to_user_settings.sql`
   - `supabase/migrations/20260228_push_subscriptions.sql`
   - (e quaisquer outros pendentes por data)

**Critério de aceite**

- As 3 estruturas acima existem e batem com o schema esperado.

---

## 3) Vercel — deploy para produção

Escolha **um** trilho conforme seu setup.

### Trilho A — "main auto-deploy"

- Fazer merge/push do commit aprovado na `main`.
- Confirmar no Vercel que o deploy foi para **Production**.

### Trilho B — "branch de produção" (ex.: `production`)

- Cherry-pick/merge do commit aprovado na branch de produção.
- Deployar essa branch.

**Verificação (comum aos dois)**

- Confirmar que o `vercel.json` com cron está no deploy:
  - `path: /api/cron/email`
  - `schedule: "*/15 * * * *"`

---

## 4) Verificação do Cron (produção)

A Vercel não garante retry se falhar (consultar logs) e pode disparar eventos duplicados ocasionalmente (idempotência já implementada).

### Checklist

1. Vercel Dashboard → Project → Settings → Cron Jobs
   - Ver `/api/cron/email` ativo
   - "View Logs" deve mostrar 200 em invocações

2. Teste manual imediato (recomendado)
   - GET no endpoint com header: `Authorization: Bearer <CRON_SECRET>`

**Critério**

- 200 + execução sem erro
- Se estiver dentro da janela de algum usuário, deve criar/atualizar uma row em `daily_email_dispatch`

---

## 5) Smoke de produção — Email (canal primário)

Com um usuário real de teste (logado):

1. Em `/today`:
   - habilitar `email_enabled`
   - setar `email_time` para cair nos próximos 15 min
   - timezone válido

2. Aguarde 1 janela (ou rode manualmente o cron com Authorization)

**Critérios**

- `daily_email_dispatch` para hoje: `sent` (se havia aniversários) ou `skipped` (se não havia)
- Rodar cron 2x no mesmo período: não duplica (UNIQUE + insert-first)

### Diagnóstico quando candidates: 0

1. **Dry-run + breakdown** (nenhum envio, nenhuma escrita):
   ```bash
   curl -s -H "Authorization: Bearer $CRON_SECRET" "https://uselembra.com.br/api/cron/email?dry-run=true&diagnostic=1"
   ```
2. Interpretar: **scannedUsers** = 0 → ninguém com `email_enabled = true`; **scannedUsers > 0** e **candidates** = 0 → todos **outsideWindow** (ver **debug.outsideWindow** e **debug.skipReasons**).
3. Para um usuário de teste (UUID em `CRON_TEST_USER_ID` na Vercel):
   ```bash
   curl -s -H "Authorization: Bearer $CRON_SECRET" "https://uselembra.com.br/api/cron/email?diagnostic=1&userId=<UUID>"
   ```
   Ver **debug.debugUser** (reasonIfNot, windowStart, windowEnd, localNowHHMM).
4. Fixture: rodar `npx tsx scripts/seed-cron-test-fixtures.ts` com CRON_TEST_USER_ID + SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL (ver docs/CRON_SETUP.md).

---

## 6) Smoke de produção — Push (complementar)

Em device real:

- **Browser normal (não standalone):** `/today` mostra instrução "instale a PWA"; não mostra toggle
- **PWA instalada (standalone) + logado:** toggle aparece; permission flow funciona; subscription aparece em `push_subscriptions`

**Critérios**

- Se push falhar, email continua normal (best-effort)
- Se endpoint inválido, `revoked_at` é preenchido (best-effort)

---

## Ordem recomendada (fechar produção)

1. Setar env vars (Vercel prod) + aplicar migrations (Supabase prod)
2. Deploy prod
3. Validar cron protegido + logs
4. Smoke email (primário)
5. Smoke push (complementar)
