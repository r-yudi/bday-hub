# Changelog

Formato adotado:
- `## [Unreleased]` para mudanças ainda não tagueadas
- `## [0.x.y] - YYYY-MM-DD` para releases publicados

## Regras de release/tag
- Atualize `Unreleased` durante o desenvolvimento.
- Ao publicar, mova os itens para a versão fechada e então crie a tag Git (`v0.x.y`).
- Use patch (`v0.1.x`) para correções/estabilização/docs/testes sem mudança grande de escopo.
- Use minor (`v0.x.0`) para incremento de capability/escopo perceptível.

## [Unreleased]

### Chore
- Co-Founder Mode permanente: novo `docs/DEFAULT_MODE.md` (estado mental padrão), PIPELINE Fase 0 (Conversação Estratégica), Operating Mode em AGENTS.md, regras estratégicas nos playbooks product/design/dev; execução só após plano e confirmação.

### Changed
- **Hero Radial Cut Explosion (abstração pura):** abandono de hero ilustrativo; forma principal >= 60vw nascendo fora da viewport (canto superior direito); orbs grandes com blur profundo; ribbon diagonal cruzando a tela; partículas grandes (4–8, não pulverizadas); spotlight radial atrás da headline; copy sobreposta à massa; mobile com corte de pôster (não SaaS minimal); regra no design-skill “Anti-hero minimalista”; 8 screenshots em `test-results/visual-regression/`.
- **V2 rodada governada (tese "Estar presente é celebrar"):** doc north-star `docs/MANIFESTO_UI_COPY.md` (mapa Manifesto→UI/copy, headline/CTA/apoio congelados, mini dicionário); hero da landing em ruptura (headline "Estar presente é celebrar.", CTA "Quero aparecer no dia" / "Continuar no app", chip "Lembra." apenas); confetes e fios dos balões visíveis em light e dark (`globals.css`); `/manage` consistência visual (tablist com `shadow-md`, badges predefinido/custom já alinhados ao contrato).
- UI stabilization (rodada atual): consolidação do contrato visual `ui-*`, refinamentos de landing/fluxos e ajustes de consistência visual sem mudar o baseline de produto.
- Dark mode premium pass: nova hierarquia de superfícies/bordas/sombras/focus/tertiary no DS, landing dark mais silenciosa e badges de categorias em `/manage` com diferenciação visual clara.
- V2 visual pass (Series A): hero da landing com CTA principal mais dominante, redução de ruído acima da dobra e hierarquia mais agressiva em `/today` e `/manage`.

### Added
- **Fase 3 — Push complementar (opt-in):** notificações push apenas para PWA instalada (standalone); toggle em `/today` quando logado + standalone; rotas `POST /api/push/subscribe` e `/api/push/unsubscribe`; envio best-effort no cron de email (web-push); tabela `push_subscriptions` e coluna `push_enabled` em `user_settings`; Service Worker mínimo `sw-push.js`; revogação automática de subscriptions inválidas (410/Gone).
- **Hero Experimental Lab:** rota `/campaign` full-bleed 100vh com hero alternativo (Light: amarelo dominante + ribbon; Dark: pool of light + glow). Copy fixa "Quem se importa, aparece."; CTA "Me avisar no dia". AppShell em `/campaign` sem TopNav; 8 screenshots exp-* em visual-regression.
- `/manage` com gestão MVP em abas (aniversários/categorias), busca/filtros e ações de editar/excluir.
- Endpoint `/healthz` para smoke test de produção/deploy.
- Multi-device sync de aniversários com Supabase quando logado (fallback local mantido quando não logado).
- Ferramentas de debug Supabase (`/debug/auth`, `/debug/supabase`) para validação de Auth/DB/RLS em desenvolvimento.
- Login Google com Supabase (`/login`, `/auth/callback`) com sessão persistente.
- `/share` como hub para gerar/copiar links e `/share/[token]` para import de aniversário compartilhado.
- Banner PWA contextual, onboarding leve e toasts de feedback.
- Categorias predefinidas + custom (guest/local-first + `user_categories` no Supabase).
- Páginas legais (`/privacy`, `/terms`) e branding Lembra.
- MVP de notificação fora do app por email diário para usuários logados (configuração em `/today` + cron protegido em `/api/cron/email`).
- Checklist visual operacional V2 em `docs/v2-visual-checklist.md`.

### Fixed
- `/` permanece como landing/entrypoint de marketing (sem redirect automático para `/today`).
- Hardening de produção para `/debug/*` (404 em produção).
- Ajustes de dark mode/superfícies e contraste em fluxos do app (`/today`, `/person`, `/share`, `/login`).
- Ajustes de UX em notificações best-effort, onboarding e copy de estados vazios.
- Validações de RLS/debug em `user_settings` e `birthdays` no fluxo de debug Supabase.

### Chore
- Consolidação do design system em utilitários `ui-*` (links terciários, callouts/disclosures, shells e overlays).
- `docs/sql/verify_schema.sql` para verificação/preparo de PK/FK/RLS no Supabase.
- Playbooks internos (`product/design/dev`) e documentação do design system para padronizar execução.

## [0.1.2] - 2026-02-24

### Added
- Playwright smoke E2E para fluxos principais do MVP.

## [0.1.1] - 2026-02-23

### Changed
- Melhorias de UX em notificações (patch de estabilização).

### Chore
- Adição de `.gitattributes`.

## [0.1.0] - 2026-02-23

### Added
- Página `/today` com lista de aniversariantes.
- Página `/upcoming` com próximos 7 dias.
- Adição/edição/exclusão de aniversários.
- Import CSV básico (formato `name,day,month,tags,...`).
- Notificações best-effort (ao abrir o app).
- Share v1 com link de aniversário (nome + data).
- PWA básico com manifest e service worker.
