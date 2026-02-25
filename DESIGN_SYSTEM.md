# DESIGN_SYSTEM.md

## Objetivo
Definir a fonte única do contrato visual do Lembra. para manter consistência entre landing, páginas do app e fluxos novos.

## Princípios
- Reutilizar antes de criar: use `ui-*` em `app/globals.css` antes de classes ad hoc.
- Tokens primeiro: cores, sombras, raios e motion vêm de `app/styles/tokens.css`.
- Clareza de hierarquia: uma ação principal por contexto, apoio visual previsível.
- Dark mode é requisito: não tratar como afterthought.
- Acessibilidade faz parte do visual: foco visível, contraste e reduced motion.

## Fonte única (onde editar)
- Tokens: `app/styles/tokens.css`
- Utilitários globais e padrões `ui-*`: `app/globals.css`
- Contexto de uso/contrato do produto: `SPEC.md` (seção de UI/DS) e `AGENTS.md`

## Mapa rápido de utilitários `ui-*` (atuais)
### Superfícies e níveis
- `ui-surface`
- `ui-surface-elevated`
- `ui-border-subtle`
- `ui-backdrop`

### Ações e foco
- `ui-cta-primary`
- `ui-cta-secondary`
- `ui-focus-surface`

### Links e texto de apoio
- `ui-link-tertiary`
- `ui-link-tertiary-muted`

### Callouts e disclosures
- `ui-callout`
- `ui-disclosure`
- `ui-disclosure-summary`

### Overlays e modais
- `ui-overlay-backdrop`
- `ui-modal-surface`

### Layout/shell
- `ui-page-shell`
- `ui-page-shell-centered`

### Tipografia/estado
- `ui-title-editorial`
- `ui-subtitle-editorial`
- `ui-inline-status`
- `ui-inline-status-dot`

## Como adicionar novo utilitário `ui-*` sem bagunçar
1. Confirmar que o padrão não já existe em `app/globals.css`.
2. Definir objetivo claro do utilitário (semântica de uso, não só visual).
3. Reusar tokens existentes em `app/styles/tokens.css` (cores/sombra/raio/motion).
4. Implementar estados necessários (`hover`, `active`, `focus-visible`, dark se aplicável).
5. Validar uso em pelo menos 2 contextos (evitar utilitário ultra-específico).
6. Atualizar este arquivo (`DESIGN_SYSTEM.md`) e, se virar contrato, mencionar em `SPEC.md`/`AGENTS.md`.
7. Evitar duplicar algo que já é composição simples de classes utilitárias do Tailwind.

## Observações
- `ds_base.html` pode servir como referência visual histórica/exploratória, mas não substitui o contrato real em `tokens.css` + `globals.css`.
- Para ajustes visuais, siga `playbooks/design-skill.md`.
