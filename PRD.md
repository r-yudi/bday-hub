# Lembra. — PRD (baseline + status atual)

## Status do projeto (atualizado em 2026-02-25)

### Resumo executivo
- Produto reposicionado como **Lembra.** (foco exclusivo em aniversários).
- App em produção com domínio canônico planejado/metadata: `https://uselembra.com.br`.
- Deploy ativo também em: `https://bday-hub.vercel.app`.
- Repositório: `https://github.com/r-yudi/bday-hub`.
- Modelo atual: **guest/local-first** (funciona sem login) + **sync com Supabase quando logado**.
- Stack principal mantida (Next.js App Router + TypeScript + Tailwind + PWA) com Supabase para auth/sync.

### Estado funcional atual (baseline real)
- Landing pública em `/` (CTA para começar e login).
- `/` é o entrypoint de marketing do produto (landing). Não redirecionar automaticamente para `/today` ou `/login`.
- Rotas principais do app:
  - `/today`
  - `/upcoming`
  - `/person`
  - `/manage`
  - `/share`
  - `/share/[token]`
- Auth Google via Supabase (`/login`, `/auth/callback`) com sessão persistente.
- Sync de aniversários multi-device quando logado (RLS validado).
- Modo sem login continua funcionando com persistência local (IndexedDB + fallback localStorage).
- Página de privacidade (`/privacy`) e termos (`/terms`).
- Ferramentas de diagnóstico (`/debug/auth`, `/debug/supabase`) disponíveis em dev e bloqueadas em produção.
- Endpoint de saúde `/healthz` para smoke test.

### UX e retenção já implementados
- Onboarding leve com progresso (5 aniversários) + feedback visual. Ordem do wizard: primeiro "Adicionar aniversários" (valor), depois "Alertas" (pedido de notificação), para que o usuário perceba valor antes de ver a etapa de permissões. No passo "Adicionar aniversários" o usuário tem: **Adicionar pessoa** (link para `/person`) e **Colar vários de uma vez** (abre o modal na view quick); o **modal de adição** (AddBirthdayEntryModal) é o ponto único de criação a partir de `/today` (menu com Adicionar pessoa, Colar vários, Importar CSV). Banner de progresso "Complete sua lista" preserva `returnTo` ao enviar para `/person`, mantendo o retorno ao onboarding quando aplicável.
- Entrada rápida em lote no empty state de `/today`: colar várias linhas no formato **Nome DD/MM** (uma por linha); parser estrito; feedback por linha (importados / inválidos) e lista de linhas ignoradas; mesma persistência que o CSV (`importCsvBirthdays`).
- Toasts discretos ao adicionar aniversários.
- PWA install banner contextual (compacto, com dismiss e instruções).
- Tema **light-only (pre-launch)**: dark mode desabilitado em runtime; detalhes em [docs/THEME.md](docs/THEME.md).
- Contrato visual **landing-first** via utilitários `ui-*` e tokens; referência em [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).
- Cartões com ações de copiar mensagem/link e feedback visual.
- Footer global com links para privacidade e termos nas páginas internas.

### Dados e sincronização (atual)
- Birthdays com compatibilidade legada e esquema atual baseado em `categories` (texto / `text[]` no Supabase).
- Categorias predefinidas + custom:
  - guest: local-first
  - logado: `user_categories` no Supabase (owner-only via RLS)
- Auth + DB + RLS já validados end-to-end em `/debug/supabase`.
- Hardening de `share_links` documentado via RPC segura (sem SELECT público direto).

### Validação contínua
- `npm run build` passando
- `npm test` passando
- `npm run test:e2e` (Playwright smoke) passando

### UI/Brand Experience
- **Landing-first:** O app interno é continuação da landing — ritmo editorial, superfícies paper, sombras mínimas (ver [docs/PRODUCT_UI_PHILOSOPHY.md](docs/PRODUCT_UI_PHILOSOPHY.md)).
- **Hierarquia:** eyebrow + título editorial (serif) + subtítulo; padrão em [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).
- **Feature blocks** no lugar de sidebars/widgets; empty states como hero sections; listas leves com separadores.
- **CTAs** alinhados à landing (`ui-cta-primary`, `ui-cta-secondary`).
- **Brand lockup** único: dot + "Lembra." no TopNav (landing e rotas do app).
- **Qualidade UI:** build + smoke E2E (`npx playwright test e2e/smoke.spec.ts`) + spec de screenshots (`e2e/screenshots-polish.spec.ts`).
- Referências: [docs/PRODUCT_UI_PHILOSOPHY.md](docs/PRODUCT_UI_PHILOSOPHY.md), [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md), [docs/THEME.md](docs/THEME.md), [docs/REBRAND_LANDING_FIRST_REPORT.md](docs/REBRAND_LANDING_FIRST_REPORT.md).

## 1) Problema
Hoje os aniversários estão espalhados (contatos, redes sociais, anotações). O usuário quer um lugar simples para:
- ver aniversariantes do dia
- ser lembrado
- agir rápido (copiar mensagem / abrir link)
- manter a lista disponível em mais de um dispositivo quando fizer login

## 2) Objetivo do produto
**O app definitivo para nunca esquecer aniversários.**

Objetivo de entrega incremental:
- manter uma experiência excelente sem login (guest/local-first)
- oferecer login Google e sincronização quando o usuário quiser
- preservar simplicidade, velocidade e privacidade

## 3) Público-alvo
Pessoas que mantêm relações em múltiplos contextos (família, amigos, trabalho, escola etc.) e querem lembrar aniversários com menos esforço e mais consistência.

## 4) Casos de uso principais (estado atual)
1. Usuário adiciona aniversários manualmente (com categorias) ou importa CSV.
2. Usuário abre o app e vê quem faz aniversário hoje / próximos 7 dias.
3. Usuário gerencia aniversários e categorias em `/manage` (busca/filtros, edição/exclusão).
4. Usuário copia mensagem pronta ou abre link para parabenizar.
5. Usuário compartilha o próprio aniversário por link (`/share/[token]`).
6. Usuário entra com Google para sincronizar aniversários entre dispositivos.

## 5) Escopo (baseline atual)
### 5.1 Incluído e entregue
- Listas “Hoje” e “Próximos 7 dias”
- CRUD de aniversários
- Gestão MVP em `/manage` com abas de aniversários/categorias, busca/filtros e ações de editar/excluir
- Importação CSV com preview e validação
- Entrada rápida em lote no empty state de `/today` (formato Nome DD/MM, uma linha por pessoa)
- Templates de mensagem + copiar
- Links rápidos (WhatsApp / Instagram / outro)
- Notificação best-effort ao abrir o app
- Compartilhamento client-only (`/share/[token]`) sem ano
- Login Google com Supabase + sessão persistente
- Sync de aniversários com Supabase quando logado
- Categorias predefinidas e custom (guest + Supabase)
- Light-only (pre-launch) e refinamentos de UX/PWA (landing-first)
- **Email diário agendado** para usuários logados (cron `/api/cron/email`, configuração em `/today`; ver SPEC 7.1); opção **reminder_timing**: no dia do aniversário (day_of) ou no dia anterior (day_before)

### 5.2 Restrições mantidas
- Sem backend próprio (usa Supabase diretamente)
- Sem ano de nascimento
- Sem social graph interno

## 6) Fora de escopo (por enquanto)
- Google Contacts import
- Notificações confiáveis em background além do email diário (push complementar já existe; expansão futura)
- Revogação granular de link de share com painel completo
- Dedupe/merge avançado na importação CSV
- Gestão avançada (ex.: bulk actions complexas em `/manage`)

## 7) Requisitos não-funcionais (atualizados)
- **Resiliência de sessão**: app não deve quebrar com refresh token inválido; fallback para guest.
- **Privacidade**: links compartilham apenas nome + dia/mês; sem ano.
- **Compatibilidade**: manter leitura de dados legados (`tags` / estruturas anteriores) sem quebrar UX.
- **Baixo atrito**: guest/local-first sempre disponível.

## 8) Métricas (mantidas / ajustadas)
- Ativação: usuário adiciona >= 5 aniversários rapidamente
- Retenção: retorno recorrente e uso de cópia de mensagem
- Conversão opcional: login Google para sync após valor percebido no modo guest

## 9) Critérios de aceite do baseline atual
- Ao abrir `/`, usuário vê a landing (marketing) como página inicial do produto.
- Usuário consegue (sem login):
  1. adicionar/editar/excluir aniversários
  2. gerenciar aniversários/categorias em `/manage` (busca/filtros + edição/exclusão)
  3. importar CSV
  4. ver Hoje e Próximos 7 dias
  5. copiar mensagem com 1 clique
  6. usar `/share/[token]` e adicionar à lista
- Usuário consegue (com login):
  1. entrar com Google
  2. manter sessão após refresh
  3. sincronizar aniversários entre dispositivos
- Build/testes/E2E smoke passam

## 10) Observação de baseline histórico
Este PRD substitui o framing inicial de MVP client-only como descrição do **estado atual do produto**, mas preserva a direção de simplicidade, baixo custo e foco em aniversários.
