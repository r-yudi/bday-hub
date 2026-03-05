# AGENTS.md

## Operating Mode

- **Default = Co-Founder Mode.** Leia [docs/DEFAULT_MODE.md](docs/DEFAULT_MODE.md) como estado mental padrão do projeto.
- Conversas devem ser tratadas como **fase Intenção** (Pipeline Fase 0). Nenhuma execução sem:
  - escopo explícito
  - lista de arquivos tocados
  - riscos mapeados
- **Manifesto vence PRD.** Em conflito, seguir [MANIFESTO.md](MANIFESTO.md).
- **Pipeline vence improviso.** Processo em [docs/PIPELINE.md](docs/PIPELINE.md) é obrigatório; não pular etapas nem executar sem plano e confirmação.

## Projeto
- Nome: Lembra.
- Objetivo atual: evoluir um app de aniversários com **modo guest/local-first** e **sync via Supabase quando logado**, sem perder simplicidade.
- Domínio canônico: `https://uselembra.com.br`
- Deploy ativo (Vercel): `https://bday-hub.vercel.app`
- Repositório: `https://github.com/r-yudi/bday-hub`

## Estado atual (baseline real)
- Produto público com landing (`/`) + páginas legais (`/privacy`, `/terms`).
- `/` deve permanecer como landing/entrypoint de marketing (sem redirect automático para `/today`).
- App principal funcionando em guest/local-first:
  - `/today`, `/upcoming`, `/person`, `/manage`, `/share`, `/share/[token]`
- Supabase já integrado para:
  - Auth Google (`/login`, `/auth/callback`)
  - Sessão persistente
  - Sync de birthdays quando logado (RLS validado)
  - `user_settings` / `user_categories`
- Debug em dev:
  - `/debug/auth`
  - `/debug/supabase`
  - em produção, `/debug/*` deve retornar 404
- `/healthz` disponível para smoke test de produção
- Build + unit tests + Playwright smoke E2E como baseline de validação

## Regras para agentes (obrigatórias)
- Ler `PRD.md` e `SPEC.md` antes de propor mudanças de escopo.
- Não alterar stack sem aprovação explícita.
- Preservar **modo guest/local-first** e **sync atual com Supabase**.
- Não criar backend próprio sem alinhamento explícito (Supabase é permitido e já faz parte da arquitetura atual).
- Se arquivo já existir, adaptar em vez de recriar.
- Documentar limitações quando algo não for confiável no browser (ex.: notificações em background).
- Não quebrar compatibilidade de leitura com dados legados sem migração clara.
- Em UI, preferir utilitários `ui-*` já existentes (evitar classes ad hoc repetidas).

## Stack atual (não trocar sem alinhamento)
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Persistência local: IndexedDB (`idb`) com fallback localStorage
- PWA: `next-pwa`
- Supabase:
  - Auth (Google OAuth)
  - Postgres + RLS
  - Sync client-side com `anon key`
- Deploy: Vercel

## Funcionalidades já entregues (baseline)
- Landing pública em `/`
- `/today` e `/upcoming`
- CRUD de aniversários (`/person`)
- Gestão MVP de aniversários/categorias (`/manage`) com abas, busca/filtros e editar/excluir
- Importação CSV com preview + validação + fallback de encoding (UTF-8/Latin1)
- Templates de mensagem + copiar
- Links rápidos (WhatsApp/Instagram/outro)
- Notificação best-effort ao abrir o app
- `/share` e `/share/[token]` (share client-only v1)
- Login Google + sessão persistente (Supabase)
- Sync multi-device de birthdays quando logado
- Categorias predefinidas + custom (guest + Supabase `user_categories`)
- Dark mode (`Claro/Escuro/Sistema`)
- Footer com links `/privacy` e `/terms`

## Segurança e dados (pontos sensíveis)
- `birthdays` no Supabase usa `categories` (schema atual). Não reintroduzir dependência da coluna legada `category`.
- `share_links` não deve ter SELECT público direto; usar RPC segura quando feature estiver ligada.
- Não usar `service_role` no client.
- RLS deve permanecer owner-only nas tabelas de usuário.

## Testes e validação (obrigatório em mudanças relevantes)
- Rodar antes de finalizar:
  - `npm test`
  - `npm run test:e2e`
  - `npm run build` (quando alterar comportamento/rotas/config)
- Smoke manual mínimo quando mexer em fluxos:
  - adicionar/editar/excluir
  - importar CSV válido/inválido
  - `/share/[token]`
  - `/today` notificações (granted/denied)
  - login Google + sessão (se tocar auth/sync)
- Debug técnico (dev):
  - `/debug/supabase` para Auth OK / DB OK / RLS OK

## Convenções práticas
- Commits pequenos e objetivos.
- Não reescrever histórico sem pedido explícito.
- Se houver patch sem mudança de escopo, usar release patch (`v0.1.x`) ou commit de correção objetivo.
- Registrar decisões/estado em `PRD.md` e `SPEC.md` sem perder contexto histórico do MVP.
- Para telas novas/ajustes visuais:
  - usar `ui-link-tertiary` para links quiet/terciários
  - usar `ui-callout` / `ui-disclosure` para blocos explicativos e detalhes técnicos
  - usar `ui-overlay-backdrop` / `ui-modal-surface` em modais/overlays

## Skills (playbooks internos do repo)
Use os playbooks em `playbooks/` para acelerar entregas com consistência, sem mudar o baseline por acidente.

### Playbooks disponíveis
- Produto: `playbooks/product-skill.md`
  - decidir escopo, fora de escopo, hipótese, critérios de aceite e atualização de `PRD.md`/`SPEC.md`
- Design: `playbooks/design-skill.md`
  - evoluir UI com contrato visual (`ui-*`, tokens, tema light-only, acessibilidade)
- Desenvolvimento: `playbooks/dev-skill.md`
  - implementar rápido com segurança (`scaffold -> wired -> polish -> harden`)

### Fonte única do design system
- `docs/DESIGN_SYSTEM.md` (canônico; raiz `DESIGN_SYSTEM.md` aponta para este)
- `docs/visual-contract.md`
- `docs/THEME.md` (light-only)
- `app/styles/tokens.css`
- `app/globals.css`

### Ritual de execução (padrão)
1. Ler `PRD.md`, `SPEC.md` e `AGENTS.md`.
2. Escolher a skill principal (`product`, `design` ou `dev`).
3. Executar o checklist do playbook escolhido.
4. Produzir saída objetiva: `diff + validação/testes aplicáveis`.
5. Atualizar `CHANGELOG.md` e `PRD.md`/`SPEC.md` quando houver mudança de baseline.

### Padrão de uso no dia a dia (prompting interno)
- "Use `playbooks/product-skill.md` para decidir escopo da feature X"
- "Faça um UI polish pass seguindo `playbooks/design-skill.md`"
- "Implemente Y com o fluxo de `playbooks/dev-skill.md`"

## Próximos focos sugeridos (vNext)
- Gestão avançada em `/manage` (bulk actions, multi-select, filtros salvos).
- Share avançado com múltiplos aniversários + fluxo remoto seguro.
- Dedupe/merge mais inteligente na importação CSV.
- Notificações mais confiáveis além do best-effort ao abrir.
- Expansão de E2E (auth/sync, permissões, regressão visual leve).
