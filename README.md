# Lembra (MVP)

Nunca mais esqueça um aniversário 🎉

MVP client-only para lembrar aniversários, conforme `SPEC.md`.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- `idb` (IndexedDB) com fallback `localStorage`
- `@supabase/supabase-js` (auth Google + sessao)
- `next-pwa` (best-effort para suporte PWA/notificações)

## Funcionalidades entregues

- Landing pública em `/` com CTA para usar o app ou entrar com Google
- Rotas ` /today ` e ` /upcoming `
- CRUD (adicionar, editar, excluir)
- Importação CSV com preview de linhas válidas/inválidas
- Templates de mensagem com botão copiar
- Abertura de links (WhatsApp/Instagram/outro)
- Persistência local (IndexedDB com fallback)
- Notificação best-effort ao abrir o app (evita duplicar no mesmo dia)
- ` /share/[token] ` (v1) para compartilhar nome + dia/mês e adicionar à lista local
- Página pública ` /privacy ` (e ` /terms ` básica)
- Botão para limpar todos os dados locais

## Notificações (estado atual)

Canal disponível:

- In-app best-effort (ao abrir o app), com permissão do navegador.
- Email diário agendado para usuário logado (configurado em `/today`).

Limitações conhecidas:

- Guest mantém apenas lembretes in-app.
- Email depende de cron + provider configurados no ambiente.

## Como rodar localmente

1. `npm install`
2. (Opcional para auth) criar `.env.local` com:
   - `NEXT_PUBLIC_SUPABASE_URL=...`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
3. `npm run dev`
4. Abrir `http://localhost:3000/today`

## Landing + privacidade

- `/` é a landing pública do produto (domínio canônico: `https://uselembra.com.br`)
- `/privacy` explica dados, armazenamento e sessão
- `/terms` traz termos básicos para início de operação pública
- Rotas internas do app (`/today`, `/upcoming`, `/person`, `/share`, etc.) continuam funcionando

## Login Google (Supabase) - checklist

Env vars usadas no client:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (opcional, meta tag do Google Search Console)

Checklist de configuração (Supabase + Google):

- Supabase `Authentication > Providers > Google` configurado com Client ID/Secret
- Supabase `Authentication > URL Configuration` inclui:
  - `http://localhost:3000/**`
  - `https://bday-hub.vercel.app/**` (ou seu dominio atual de producao)
- Google Cloud OAuth inclui:
  - Authorized JavaScript origins: `http://localhost:3000` e dominio de producao
  - Redirect URI: callback do Supabase (`https://<project-ref>.supabase.co/auth/v1/callback`)

Env vars adicionais para email diário (server):

- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (ou `REMINDER_FROM_EMAIL`)

Env vars para Web Push (server; PWA instalada, opt-in):

- `VAPID_PUBLIC_KEY` — chave pública VAPID (gerar com `npx web-push generate-vapid-keys`)
- `VAPID_PRIVATE_KEY` — chave privada VAPID (não commitar)
- `VAPID_SUBJECT` — mailto ou URL do site (ex.: `mailto:suporte@uselembra.com.br` ou `https://uselembra.com.br`)
- No client, defina `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (mesma chave pública) para o subscribe no navegador.

Como testar localmente:

1. Definir as env vars em `.env.local`
2. Rodar `npm run dev`
3. Visitar `/debug/supabase` antes do login e validar:
   - health (`/auth/v1/health`) responde OK
   - `getSession()` retorna `session null`
   - `getUser()` sem usuário (ou erro esperado sem sessão)
4. Abrir `/login` e clicar em `Entrar com Google`
5. Confirmar retorno para `/auth/callback` e depois redirecionamento para a rota protegida (`/today`, `/upcoming` ou `/share`)
6. Voltar em `/debug/supabase` e validar:
   - `getSession()` com `session/user` preenchidos
   - `getUser()` com `user` preenchido
   - botão `Testar DB` retorna `DB OK (RLS OK)` (faz probe + upsert/select da própria linha em `user_settings`)
7. (Opcional) abrir `/debug/auth` em desenvolvimento para um painel resumido (`Auth OK` / `DB OK`)

Como validar em producao:

1. Configurar as env vars públicas na Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Fazer redeploy após criar/alterar env vars (deploy antigo não lê mudanças retroativamente)
3. Confirmar `/healthz` retorna `200 OK`
4. Confirmar URLs/origins no Supabase e Google Cloud para o domínio de produção
5. Fazer login em `/login`
6. Confirmar persistência da sessão após refresh
7. Criar um aniversário no desktop logado
8. Abrir no mobile logado com a mesma conta e confirmar sincronização em `/today` ou `/upcoming`
9. No painel Supabase, validar em `Authentication > Users` que o usuário foi criado

## Checklist de deploy (Vercel + Supabase + Google)

Vercel:

- Definir `NEXT_PUBLIC_SUPABASE_URL`
- Definir `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- (Opcional) Definir `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` para Google Search Console
- Redeploy após mudança de env vars
- Smoke test:
  - `GET /healthz` => 200
  - `/login` abre normalmente
  - `/debug/*` deve retornar 404 em produção
  - `/` abre landing pública

Supabase Auth > URL Configuration:

- `Site URL` apontando para o domínio de produção (ex.: `https://uselembra.com.br`)
- `Redirect URLs` incluindo:
  - `http://localhost:3000/**`
  - `https://uselembra.com.br/**`
  - `https://www.uselembra.com.br/**` (se usar www)

Google OAuth (Web client):

- Authorized JavaScript origins:
  - `http://localhost:3000`
  - `https://uselembra.com.br`
  - `https://www.uselembra.com.br` (se usar www)
- Authorized redirect URI:
  - callback do Supabase (`https://<project-ref>.supabase.co/auth/v1/callback`)

## Analytics + SEO

- Analytics habilitado com `@vercel/analytics`
- Performance insights habilitado com `@vercel/speed-insights`
- `robots.txt` e `sitemap.xml` gerados pelo App Router
- `/debug/*` não indexado (robots + bloqueio em produção)
- Canonical configurado para `https://uselembra.com.br`

## Search Console (verificação por meta tag)

Para habilitar:

1. Copie o token de verificação da propriedade no Google Search Console
2. Defina `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` na Vercel
3. Faça redeploy
4. Verifique se a meta tag aparece no HTML da home e confirme no Search Console

Checklist de troubleshooting (quando o login nao completa):

- Validar `/debug/supabase` antes do login (health OK)
- Conferir se o retorno passa por `/auth/callback`
- Na tela `/auth/callback`, se houver erro, revisar:
  - Supabase `Redirect URLs` allowlist (`http://localhost:3000/**` e dominio de producao)
  - Google OAuth redirect URI do projeto Supabase (`/auth/v1/callback`)
- Usar `Limpar sessão local` em `/debug/supabase` e tentar novamente
- Conferir `Authentication > Users` no Supabase apos tentativa de login

## Schema Supabase (v2 - referencia)

Tabelas principais esperadas:

- `public.user_settings`
  - PK: `user_id` (uma linha por usuario)
  - `user_id` referencia `auth.users(id)`
- `public.birthdays`
  - PK: `id`
  - `user_id` referencia `auth.users(id)` (para RLS)
  - indice recomendado: `(user_id, month, day)`

Validacao de DB pelo `/debug/supabase`:

- `Testar DB` usa `select('user_id').limit(1)` em `user_settings`
- Depois executa `upsert` da linha do usuario logado (`user_id = auth user id`) e `select` da propria linha
- Se passar, mostra `DB OK (RLS OK)`

SQL de verificacao/preparo (PK/FK/RLS):

- `docs/sql/verify_schema.sql` (rodar no Supabase SQL Editor)

## Multi-device sync (Birthdays)

Comportamento atual:

- Usuario logado: `birthdays` usa Supabase como source of truth (com cache local)
- Usuario nao logado: continua modo local/offline como no MVP
- Ao fazer login: o app faz merge local + Supabase (last-write-wins por `updatedAt`) e sincroniza em background

Como testar multi-device:

1. Fazer login com a mesma conta no desktop e no mobile
2. No desktop, criar ou editar um aniversario em `/person`
3. Abrir `/today` ou `/upcoming` no mobile (mesma conta)
4. Confirmar que o aniversario aparece apos sincronizacao
5. Em `/debug/supabase`, usar:
   - `Testar DB` para validar `user_settings` + RLS
   - `Testar Birthdays` para validar `count` e `upsert/delete` dummy em `birthdays`

## Testes (mínimo da SPEC)

- `npm test` roda testes unitários de:
  - cálculo de próximos 7 dias
  - validação/parsing de CSV

## Testes E2E (Playwright)

- Instalar dependencias: `npm install`
- Instalar browser do Playwright (primeira vez): `npx playwright install chromium`
- Rodar smoke tests E2E: `npm run test:e2e`

Cobertura atual (smoke):
- CRUD de aniversario
- Import CSV (preview + import)
- Persistencia apos reload
- `/share/[token]` com CTA "Adicionar a lista"

Para gerar screenshots das rotas principais (light):

- `npx playwright test e2e/screenshots-polish.spec.ts`

## Design / UI (rebrand landing-first)

- **Landing-first:** Páginas internas do app seguem o ritmo editorial da landing (whitespace, hierarquia eyebrow + título serif + subtítulo, superfícies "paper").
- **Utilitários `ui-*`:** Definidos em `app/globals.css`; tokens em `app/styles/tokens.css`. Contrato canônico em `docs/DESIGN_SYSTEM.md`.
- **Light-only:** Tema escuro está desabilitado em produção (pre-launch). Apenas light mode é aplicado. Detalhes em `docs/THEME.md`.
- **Referência da landing:** `app/(marketing)/landing.css` e `docs/REBRAND_LANDING_FIRST_REPORT.md` (section layout, feature cards, identity diff).

## Quality gates

Antes de merge/PR, rodar:

- `npm run build`
- `npx playwright test e2e/smoke.spec.ts`
- `npx playwright test e2e/screenshots-polish.spec.ts` (opcional)

## UI reference

- **Landing CSS:** `app/(marketing)/landing.css`
- **Rebrand report (section layout, tokens, utilitários):** `docs/REBRAND_LANDING_FIRST_REPORT.md`
- **Design System (contrato, lista de utilitários, páginas migradas):** `docs/DESIGN_SYSTEM.md`
- **Tema (light-only):** `docs/THEME.md`

## CSV suportado

Header obrigatório:

```csv
name,day,month,tags,whatsapp,instagram,notes
```

- `tags` separado por `;`
- Exemplo pronto em `public/sample-birthdays.csv`
- Exemplo com erros (para testar preview de inválidas): `public/sample-birthdays-invalid.csv`

## Fluxos rápidos para validar o MVP

1. Adicionar uma pessoa em ` /person `
2. Voltar para ` /today ` e verificar listagem
3. Importar `public/sample-birthdays.csv`
4. Importar `public/sample-birthdays-invalid.csv` para validar preview de erros
5. Abrir ` /upcoming `
6. Copiar mensagem / link compartilhável em um card
7. Abrir o link ` /share/[token] ` em outra aba e clicar em "Adicionar à minha lista"
8. Ativar notificações e reabrir o app (com aniversariante hoje) para testar best-effort

## Script opcional de seed

- `npm run seed` recria o CSV de exemplo em `public/sample-birthdays.csv`

## Observações de privacidade

- Sem backend no MVP
- Dados ficam no dispositivo do usuário
- O link compartilhável expõe apenas `nome + dia/mês` (sem ano)
- Sem revogação individual de link no v1 (limitação sem backend)
