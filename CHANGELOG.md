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

### Changed
- UI stabilization (rodada atual): consolidação do contrato visual `ui-*`, refinamentos de landing/fluxos e ajustes de consistência visual sem mudar o baseline de produto.
- Dark mode premium pass: nova hierarquia de superfícies/bordas/sombras/focus/tertiary no DS, landing dark mais silenciosa e badges de categorias em `/manage` com diferenciação visual clara.

### Added
- `/manage` com gestão MVP em abas (aniversários/categorias), busca/filtros e ações de editar/excluir.
- Endpoint `/healthz` para smoke test de produção/deploy.
- Multi-device sync de aniversários com Supabase quando logado (fallback local mantido quando não logado).
- Ferramentas de debug Supabase (`/debug/auth`, `/debug/supabase`) para validação de Auth/DB/RLS em desenvolvimento.
- Login Google com Supabase (`/login`, `/auth/callback`) com sessão persistente.
- `/share` como hub para gerar/copiar links e `/share/[token]` para import de aniversário compartilhado.
- Banner PWA contextual, onboarding leve e toasts de feedback.
- Categorias predefinidas + custom (guest/local-first + `user_categories` no Supabase).
- Páginas legais (`/privacy`, `/terms`) e branding Lembra.

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
