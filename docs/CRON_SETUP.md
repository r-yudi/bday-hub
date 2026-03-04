# Cron de email — setup (Vercel Hobby + GitHub Actions)

## Por que dois mecanismos?

- **Vercel Hobby** não permite cron com frequência `*/15` em `vercel.json` (limitação de plano; deploy falhava).
- **vercel.json** foi ajustado para **1x/dia** (`0 12 * * *`) para o deploy passar e o endpoint existir em produção.
- O **schedule real (a cada 15 min)** é feito por **GitHub Actions** (`.github/workflows/cron-email.yml`), que chama `GET /api/cron/email` com o mesmo secret.

## O que você precisa fazer manualmente

1. **Criar o secret no GitHub** (uma vez):
   - Repositório → **Settings** → **Environments** → **Production** → **Environment secrets**
   - **Add secret**: nome `CRON_SECRET`, valor igual ao **Vercel → Environment Variables → CRON_SECRET** (produção)
   - O workflow usa `environment: production` para ler esse secret.

2. Após isso, o workflow **Cron email (15 min)** rodará a cada 15 minutos e chamará `https://uselembra.com.br/api/cron/email` com `Authorization: Bearer <CRON_SECRET>`.

3. (Opcional) Para testar sem esperar 15 min: **Actions** → **Cron email (15 min)** → **Run workflow** → **Run workflow**.

## Schedule e runs automáticos

- **Schedules podem atrasar**: o GitHub não garante execução no minuto exato. Para validar que o schedule está ativo, aguarde **20–30 min** e verifique em **Actions** se aparece algum run com **Event = schedule** (não só runs manuais com Event = workflow_dispatch).
- No log do job, o primeiro passo imprime `event: schedule` ou `event: workflow_dispatch` para confirmar a origem.

## Se não aparecer nenhum run com Event = schedule

1. **Settings** → **Actions** → **General**:
   - Em "Actions permissions": **Allow all actions and reusable workflows** (ou pelo menos permitir que o repositório use workflows).
   - Em "Workflow permissions": **Read and write** (ou o mínimo que permita o job rodar).
   - Salve.
2. Aguarde mais um ciclo (até 30 min). O GitHub pode atrasar a primeira execução de workflows agendados em repositórios com pouca atividade.
3. Se ainda não houver run por schedule, confira se o workflow está na branch padrão (ex.: `main`) e se o arquivo está em `.github/workflows/cron-email.yml`.

## Deploy em produção (uselembra.com.br)

1. **Confirmar no Vercel** qual commit está em **Production** no domínio uselembra.com.br (Deployments → Production).
2. Se estiver atrasado em relação à `main`, fazer **Redeploy** do último commit da `main` (ou reconectar o deploy à branch).
3. Após o deploy:
   - **GET** `https://uselembra.com.br/api/cron/email` no browser (sem header) → deve retornar **401**.
   - **GET** com `Authorization: Bearer <CRON_SECRET>` → deve retornar **200**.
   - **GET** `https://uselembra.com.br/today`: deve aparecer a seção **Email diário** (logado: toggle, horário, fuso; guest: CTA "Entrar para ativar email"). Se não aparecer, o deploy provavelmente está em um commit antigo — refaça o redeploy.

## Endpoint

- **GET** `/api/cron/email`
- Sem header ou secret inválido → **401** (JSON `{ "ok": false, "message": "unauthorized" }`)
- Com `x-cron-secret` ou `Authorization: Bearer <CRON_SECRET>` → **200** (JSON `{ "ok": true, ... }`)
