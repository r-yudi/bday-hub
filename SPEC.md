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
  - tema claro / escuro / sistema; ver [docs/THEME.md](docs/THEME.md)
  - onboarding leve e toasts; ordem do wizard: passo 1 Login → passo 2 Adicionar aniversários → passo 3 Alertas (notificação) → passo 4 Dicas (pedido de notificação só após valor percebido). No passo 2: CTA "Adicionar pessoa" e "Colar vários de uma vez" (abre modal na view quick); modal de adição é o ponto único de criação a partir de /today (menu: Adicionar pessoa, Colar vários, Importar CSV). Banner "Complete sua lista" (X de 5) preserva `returnTo` no link para /person.
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
  - tema **claro / escuro / sistema:** `lib/theme.ts`, `components/ThemeProvider.tsx`, controle em `components/TopNav.tsx`. Ver [docs/THEME.md](docs/THEME.md)
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
  - `csv.ts`, `csv-file.ts`, `dates.ts`, `share.ts`, `suggestedBirthdayMessage.ts`, `theme.ts`
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
  - `nickname?` (UI: **Como chamar**; mensagem sugerida no dia), `notes?` (UI: **Sobre essa pessoa**; só referência, não compõe a sugestão), `links?` (`whatsapp`/`instagram` persistidos como URL; entrada no form como número e @/usuário — ver `lib/personLinks.ts`; URLs legadas intactas), `createdAt`, `updatedAt`
- `AppSettings`:
  - `notificationEnabled`, `notificationTime`, `lastNotifiedDate?`

### 3.2 Supabase (atual)
- `birthdays`
  - inclui `user_id`
  - usa `categories text[]` (schema atual)
  - coluna opcional `nickname` (text) para “Como chamar” / mensagem sugerida
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
- Cartão do dia: **Mensagem sugerida** (preview clicável para copiar + Copiar + Editar); `getTodaySuggestedMessage` usa `nickname` ou primeiro nome + 1 de 3 frases fixas; `notes` não compõem a sugestão (podem aparecer como referência no card). Hint se `nickname` vazio; microcopy curta para copiar ao toque/clique.
- CTA adicionar, importar CSV, lembretes best-effort
- **Entrada rápida (empty state):** bloco "Colar vários de uma vez" com textarea; formato aceito: uma linha por pessoa, **Nome DD/MM** (dia/mês com 1 ou 2 dígitos); feedback de importados/inválidos e detalhe de linhas ignoradas; persistência via `importCsvBirthdays` (sem alterar schema/CSV)
- onboarding e feedbacks de cópia

### `/upcoming`
- Lista próximos 7 dias
- Cartões: cópia principal de mensagem segue **templates com nome** existentes (sem a regra de `getTodaySuggestedMessage`).

### `/person`
- Form de cadastro/edição
- Campo **Como chamar** (`nickname`, opcional) e **Sobre essa pessoa** (`notes`): placeholders e hints; `notes` não alimenta a mensagem sugerida.
- **WhatsApp / Instagram:** labels e placeholders pedem número e @/usuário; persistência via `persistWhatsappLink` / `persistInstagramLink`; edição exibe valor amigável com `formatWhatsappForInput` / `formatInstagramForInput` quando a origem é URL.
- Ajuda do form: botão **?** por campo abre/fecha painel curto com a dica (touch e desktop; `aria-expanded`/`aria-controls`; não depende de `title`/hover para o conteúdo).
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
  - tabela `daily_email_dispatch` com UNIQUE(user_id, date_key); insert-first; claim de pending antigo (stale) antes do envio.
- Diagnóstico (apenas com CRON_SECRET):
  - `diagnostic=1` ou header `X-Debug: 1` — resposta inclui objeto `debug` com breakdown (scannedUsers, outsideWindow, candidates, skipReasons, etc.).
  - `dry-run=true` — mesma lógica de elegibilidade e breakdown; **nenhum envio, nenhuma escrita** em dispatch (100% read-only).
  - Filtro por usuário de teste: query `userId=` ou header `X-Debug-UserId` só é aceito quando o UUID está em `CRON_TEST_USER_ID` (env, lista separada por vírgula).
- Fixture para teste em produção: script interno `scripts/seed-cron-test-fixtures.ts` (ver docs/CRON_SETUP.md).
- **Horário e timezone (regra única):**
  - Horário de envio = horário escolhido pelo usuário (**email_time** em `user_settings`) interpretado no **timezone** salvo em `user_settings.timezone`. Ex.: 09:00 em America/Sao_Paulo = 09:00 em Brasília.
  - Push e email compartilham a **mesma janela de envio** (mesmo `email_time` e mesmo `timezone`); o cron usa o instante UTC atual, converte para o timezone do usuário e verifica se está em [email_time, email_time + 15 min).
  - Não se usa horário do servidor como regra de negócio; a referência é sempre "agora" em UTC convertido para o timezone do usuário.
  - **Fallback de timezone:** se `user_settings.timezone` estiver ausente ou inválido (ex.: string vazia ou IANA inexistente), usa-se **America/Sao_Paulo** (constante `FALLBACK_TZ` em `lib/timezone.ts`). O mesmo fallback é usado em `getDateKey` e em `getDatePartsInTimeZone` para garantir consistência.
- **Quando receber o lembrete (reminder_timing):**
  - **day_of** (padrão): o digest considera aniversários de **hoje** no timezone do usuário (comportamento clássico).
  - **day_before**: o digest considera aniversários de **amanhã** no timezone do usuário; o usuário recebe o lembrete um dia antes do aniversário, no horário configurado. Push e email usam o mesmo digest; a data alvo é sempre calculada com o timezone do usuário.

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

### Design Tokens
- **Arquivo:** `app/styles/tokens.css`
- Papéis: `--bg`, `--surface`, `--surface-2`, `--text`, `--muted`, `--border`, `--primary`, `--primary-foreground`, `--accent`, `--warning`, `--success`, `--danger`, `--radius-sm/md/lg/xl`, `--ui-*` (superfícies, bordas, foco).
- **Light-only:** a classe `.dark` não é aplicada no `<html>`; tokens `.dark` existem no CSS mas não são usados em runtime. Ver [docs/THEME.md](docs/THEME.md).

### UI Utilities
Composição via classes `ui-*` em `app/globals.css`. Tabela **Utility → Uso recomendado:**

| Utility | Uso recomendado |
|---------|------------------|
| `ui-container` | Envolver conteúdo principal da página (max-width 1200px, padding responsivo) |
| `ui-section` | Bloco com padding vertical generoso |
| `ui-section-header` | Stack eyebrow + título + subtítulo |
| `ui-eyebrow` | Label pequeno uppercase (accent ou muted) |
| `ui-feature-block` (+ title/body/actions) | Blocos laterais (ex.: Lembretes, Email em /today) |
| `ui-empty-hero` (+ icon/title/subtitle/actions) | Empty state editorial |
| `ui-list` / `ui-list-item` | Listas com separador sutil, hover leve |
| `ui-cta-primary` / `ui-cta-secondary` | CTAs alinhados à landing |
| `ui-panel` / `ui-panel-soft` / `ui-surface` | Superfícies paper, borda sutil |
| `ui-overlay-backdrop` / `ui-modal-surface` | Overlay e superfície de modal |

### Page Layout Pattern
- Estrutura típica: `ui-container` > `ui-section` > `ui-section-header` (eyebrow + título + subtítulo) + conteúdo.

### Lists / Empty / Feature Blocks
- **Listas:** usar `ui-list` como wrapper e `ui-list-item` por item; dentro do item pode haver `ui-panel` (borda/sombra removidas pelo contexto).
- **Empty state:** usar `ui-empty-hero` com `ui-empty-icon`, `ui-empty-title`, `ui-empty-subtitle`, `ui-empty-actions`.
- **Blocos laterais:** usar `ui-feature-block` com `ui-feature-title`, `ui-feature-body`, `ui-feature-actions` (ex.: cards de Lembretes/Email em /today).

### Modals
- Backdrop: `ui-overlay-backdrop` (fixed inset-0, grid place-items-center).
- Superfície: `ui-modal-surface` (max-width, border, padding).

### Testing/Validation
- Comandos: `npm run build`, `npm test`, `npm run test:e2e`.
- Smoke: `npx playwright test e2e/smoke.spec.ts`.
- Screenshots (polish): `npx playwright test e2e/screenshots-polish.spec.ts`.
- Contrato visual (referência): [docs/visual-contract.md](docs/visual-contract.md) — light e dark via tokens.

### Referências de UI
- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) — contrato completo, tokens, utilitários, páginas migradas
- [docs/PRODUCT_UI_PHILOSOPHY.md](docs/PRODUCT_UI_PHILOSOPHY.md) — filosofia e guardrails
- [docs/REBRAND_LANDING_FIRST_REPORT.md](docs/REBRAND_LANDING_FIRST_REPORT.md) — section layout, identity diff
- [docs/THEME.md](docs/THEME.md) — claro / escuro / sistema

## 10) Limitações / próximos focos (vNext)
- Revogação completa de links compartilhados com UX de gestão
- Dedupe/merge avançado de CSV
- Notificações mais confiáveis (push/email/cron)
- Fluxos avançados de gestão em `/manage` (bulk actions, multi-select, filtros salvos)

## 11) Nota de compatibilidade
O app mantém compatibilidade de leitura com dados legados (`tags` / formatos anteriores), mas o schema atual de `birthdays` no Supabase deve usar `categories` e **não depender** da coluna legada `category`.
