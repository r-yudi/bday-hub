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

- Rotas ` /today ` e ` /upcoming `
- CRUD (adicionar, editar, excluir)
- Importação CSV com preview de linhas válidas/inválidas
- Templates de mensagem com botão copiar
- Abertura de links (WhatsApp/Instagram/outro)
- Persistência local (IndexedDB com fallback)
- Notificação best-effort ao abrir o app (evita duplicar no mesmo dia)
- ` /share/[token] ` (v1) para compartilhar nome + dia/mês e adicionar à lista local
- Botão para limpar todos os dados locais

## Limitação conhecida (MVP)

Notificação agendada confiável em background varia por navegador/OS. Implementado fallback aceito na SPEC:

- O app tenta notificar **ao abrir**
- Se a permissão não estiver disponível/concedida, o app mostra aviso em tela na rota ` /today `

## Como rodar localmente

1. `npm install`
2. (Opcional para auth) criar `.env.local` com:
   - `NEXT_PUBLIC_SUPABASE_URL=...`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
3. `npm run dev`
4. Abrir `http://localhost:3000/today`

## Login Google (Supabase) - checklist

Env vars usadas no client:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Checklist de configuração (Supabase + Google):

- Supabase `Authentication > Providers > Google` configurado com Client ID/Secret
- Supabase `Authentication > URL Configuration` inclui:
  - `http://localhost:3000/**`
  - `https://bday-hub.vercel.app/**` (ou seu dominio atual de producao)
- Google Cloud OAuth inclui:
  - Authorized JavaScript origins: `http://localhost:3000` e dominio de producao
  - Redirect URI: callback do Supabase (`https://<project-ref>.supabase.co/auth/v1/callback`)

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

1. Configurar as mesmas env vars na Vercel
2. Confirmar URLs/origins no Supabase e Google Cloud para o dominio de producao
3. Fazer login em `/login`
4. Confirmar persistencia da sessao apos refresh
5. No painel Supabase, validar em `Authentication > Users` que o usuario foi criado

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
