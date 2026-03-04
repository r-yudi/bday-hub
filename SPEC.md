# Lembra. — SPEC (baseline atual)

## Status de implementação (atualizado em 2026-02-25)

### Estado geral
- App em produção com branding **Lembra.**
- Domínio canônico configurado em metadata/SEO: `https://uselembra.com.br`
- Deploy ativo: `https://bday-hub.vercel.app`
- Repositório: `https://github.com/r-yudi/bday-hub`
- Fluxo atual: **guest/local-first** + **Supabase Auth/Sync** quando logado

### Implementado (baseline atual)
- Rotas públicas:
  - `/` (landing)
  - `/privacy`
  - `/terms`
  - `/healthz`
- Rotas do app:
  - `/today`
  - `/upcoming`
  - `/person`
  - `/manage`
  - `/share`
  - `/share/[token]`
- Auth:
  - `/login`
  - `/auth/callback`
  - sessão persistente via Supabase
  - fallback resiliente para sessão inválida (retorna para guest sem crash)
- Debug (dev only; 404 em produção):
  - `/debug/auth`
  - `/debug/supabase`
- Sync:
  - birthdays sincronizados com Supabase quando usuário está logado
  - fallback local quando não logado
- UX:
  - dark mode (light/dark/system)
  - onboarding leve e toasts
  - banner PWA contextual
  - links de privacidade/termos no footer interno
- Categorias:
  - predefinidas + custom (guest + `user_categories` no Supabase)
  - birthdays usam `categories` (texto / array de texto no banco)

## 1) Stack (mantida)
- Frontend: Next.js (App Router) + TypeScript
- UI: Tailwind CSS
- Design System:
  - tokens em `app/styles/tokens.css`
  - utilitários globais `ui-*` em `app/globals.css`
- Persistência local: IndexedDB (via `idb`) com fallback localStorage
- PWA: `next-pwa`
- Deploy: Vercel
- Auth/DB/Sync: Supabase (client-side com ANON key + RLS)

> Não usar `service_role` no client.
> Manter modo local-first funcionando sem login.

## 2) Estrutura de pastas (resumo atual)
- `/app`
  - `/` (landing)
  - `/today`
  - `/upcoming`
  - `/person`
  - `/manage`
  - `/share`
  - `/share/[token]`
  - `/login`
  - `/auth/callback`
  - `/privacy`
  - `/terms`
  - `/debug/auth`
  - `/debug/supabase`
  - `/healthz`
- `/components`
  - `TopNav`, `PersonCard`, `PersonForm`, `ImportCsv`, `Templates`, `AppShell`, etc.
- `/lib`
  - `storage.ts` (local)
  - `birthdaysRepo.ts` (repo local/Supabase)
  - `categoriesRepo.ts`
  - `supabase-browser.ts`
  - `csv.ts`, `csv-file.ts`, `dates.ts`, `share.ts`, `theme.ts`
- `/supabase/migrations`
  - migrations de theme, categories e ajustes de schema/RLS
- `/docs/sql`
  - scripts de verificação/hardening (quando aplicável)

## 3) Modelo de dados (baseline atual)

### 3.1 Tipos locais (app)
- `SourceType`: `manual | csv | shared`
- `BirthdayPerson` (compatível com legado):
  - `id`, `name`, `day`, `month`, `source`
  - `categories?: string[]` (preferencial)
  - `tags: string[]` (compatibilidade)
  - `notes?`, `links?`, `createdAt`, `updatedAt`
- `AppSettings`:
  - `notificationEnabled`, `notificationTime`, `lastNotifiedDate?`

### 3.2 Supabase (atual)
- `birthdays`
  - inclui `user_id`
  - usa `categories text[]` (schema atual)
  - RLS owner-only
- `user_settings`
  - PK em `user_id`
  - preferências (ex.: `theme`)
  - RLS owner-only
- `user_categories`
  - categorias custom por usuário
  - RLS owner-only
- `share_links` (hardening documentado)
  - leitura pública via RPC segura (sem SELECT público direto)

## 4) Regras de negócio (vigentes)
- Ano não é armazenado/exibido em fluxos de share.
- `/share/[token]` expõe apenas nome + dia/mês.
- Sync de birthdays:
  - se logado -> Supabase é source of truth
  - se deslogado -> storage local
  - merge simples por `id` + `updatedAt` (last write wins) no bootstrap de login
- Sessão inválida do Supabase:
  - limpar sessão local
  - fallback para guest
  - aviso discreto de sessão expirada

## 5) UI / Rotas (estado atual)
### `/`
- Landing pública (entrypoint padrão) com CTA para `/today` e `/login`
- Não deve haver redirect automático de `/` para `/today`/`/login`

### `/today`
- Lista de aniversários de hoje
- CTA adicionar, importar CSV, lembretes best-effort
- onboarding e feedbacks de cópia

### `/upcoming`
- Lista próximos 7 dias

### `/person`
- Form de cadastro/edição
- categorias (multi-select leve + criação rápida)

### `/manage`
- Página de gestão com abas:
  - aniversários
  - categorias
- Aniversários:
  - lista completa
  - busca + filtros (texto/categoria/origem/mês)
  - editar (atalho para `/person?id=...`) e excluir
- Categorias:
  - lista completa (predefinidas + custom)
  - busca + filtros (tipo/uso)
  - editar/excluir categorias custom
  - ao editar/excluir categoria custom, propaga alteração para aniversários associados
  - categorias predefinidas ficam somente leitura no MVP

### `/share`
- Hub para gerar/copiar links de compartilhamento

### `/share/[token]`
- Adicionar aniversário compartilhado à própria lista

### `/login` / `/auth/callback`
- Login Google via Supabase OAuth redirect
- callback com retry curto de sessão + painel de diagnóstico em erro

## 6) Importação CSV (estado atual)
- Header suportado: `name,day,month,tags,whatsapp,instagram,notes`
- `tags` funciona como fonte de categorias
- Separadores suportados em `tags`: `,`, `;`, `|`
- Decode robusto UTF-8/Latin1 com fallback para evitar mojibake
- Normalização NFC

## 7) Notificações (baseline)
- Estratégia MVP mantida: best-effort ao abrir o app
- Sem agendamento confiável em background (limitação conhecida/documentada)

## 7.1 Notificações V2 (fora do app)
- Canal MVP principal: **email diário agendado** para usuários logados.
- Configuração no app:
  - `/today` exibe card de email diário (ativar/desativar + horário).
  - timezone padrão: `America/Sao_Paulo`.
- Fluxo guest vs logado:
  - guest continua com lembrete in-app best-effort.
  - logado pode ativar lembrete por email fora da interface.
- Agendamento:
  - cron a cada 15 minutos (`/api/cron/email`).
  - proteção por `CRON_SECRET` (header `x-cron-secret` ou Bearer).
- Dedupe/idempotência:
  - controle por `user_settings.last_daily_email_sent_on`.
  - claim condicional antes do envio para reduzir duplicidade em execuções concorrentes.

## 8) Segurança e privacidade
- RLS em tabelas de usuário (`birthdays`, `user_settings`, `user_categories`)
- Links compartilháveis sem ano
- Hardening de `share_links` para evitar SELECT público direto (via RPC)
- Rotas `/debug/*` bloqueadas em produção (404)

## 9) Testes e validação
- Unit tests:
  - datas / próximos dias
  - CSV parse/validação/encoding
  - share token roundtrip
- Playwright smoke E2E:
  - CRUD
  - import CSV
  - persistência após reload
  - `/share/[token]` -> adicionar à lista
  - (expansão futura) `/manage` busca/filtros/edição de categorias
- Comandos obrigatórios em mudanças relevantes:
  - `npm run build`
  - `npm test`
  - `npm run test:e2e`

## 9.1 Contrato de UI (DS)
- Reutilizar utilitários `ui-*` antes de criar classes ad hoc:
  - superfícies/níveis: `ui-surface`, `ui-surface-elevated`, `ui-border-subtle`
  - CTAs e ações: `ui-cta-primary`, `ui-cta-secondary`, `ui-focus-surface`
  - links tertiary: `ui-link-tertiary` / `ui-link-tertiary-muted`
  - callouts/disclosures: `ui-callout`, `ui-disclosure`, `ui-disclosure-summary`
  - shells centrados/overlays: `ui-page-shell`, `ui-page-shell-centered`, `ui-overlay-backdrop`, `ui-modal-surface`
- Em dark mode, o fundo deve recuar (grid/glows discretos); conteúdo deve viver em superfícies previsíveis.
- Referência operacional do contrato visual (dark + elevação + badges + focus + tertiary): `docs/visual-contract.md`

## 10) Limitações / próximos focos (vNext)
- Revogação completa de links compartilhados com UX de gestão
- Dedupe/merge avançado de CSV
- Notificações mais confiáveis (push/email/cron)
- Fluxos avançados de gestão em `/manage` (bulk actions, multi-select, filtros salvos)

## 11) Nota de compatibilidade
O app mantém compatibilidade de leitura com dados legados (`tags` / formatos anteriores), mas o schema atual de `birthdays` no Supabase deve usar `categories` e **não depender** da coluna legada `category`.
