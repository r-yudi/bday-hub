# Cron de email — setup (Vercel Hobby + GitHub Actions)

## Por que dois mecanismos?

- **Vercel Hobby** não permite cron com frequência `*/15` em `vercel.json` (limitação de plano; deploy falhava).
- **vercel.json** foi ajustado para **1x/dia** (`0 12 * * *`) para o deploy passar e o endpoint existir em produção.
- O **schedule real (a cada 15 min)** é feito por **GitHub Actions** (`.github/workflows/cron-email.yml`), que chama `GET /api/cron/email` com o mesmo secret.

## O que você precisa fazer manualmente

1. **Criar o secret no GitHub** (uma vez):
   - Repositório → **Settings** → **Secrets and variables** → **Actions**
   - **New repository secret**
   - Nome: `CRON_SECRET`
   - Valor: **o mesmo** que está em **Vercel → Environment Variables → CRON_SECRET** (produção)

2. Após isso, o workflow **Cron email (15 min)** passará a rodar a cada 15 minutos e chamar `https://uselembra.com.br/api/cron/email` com `Authorization: Bearer <CRON_SECRET>`.

3. (Opcional) Para testar sem esperar 15 min: **Actions** → **Cron email (15 min)** → **Run workflow** → **Run workflow**.

## Endpoint

- **GET** `/api/cron/email`
- Sem header ou secret inválido → **401** (JSON `{ "ok": false, "message": "unauthorized" }`)
- Com `x-cron-secret` ou `Authorization: Bearer <CRON_SECRET>` → **200** (JSON `{ "ok": true, ... }`)
