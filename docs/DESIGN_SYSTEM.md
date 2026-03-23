# Design System (canonical)

Documentação canônica do contrato visual do Lembra. Mantida em `docs/DESIGN_SYSTEM.md`. O arquivo na raiz `DESIGN_SYSTEM.md` aponta para este.

## Objetivo

Definir a fonte única do contrato visual para consistência entre landing e páginas do app (rebrand "Landing UI inside the app").

## Design Contract (bullets)

- Reutilizar antes de criar: use utilitários `ui-*` em `app/globals.css` antes de classes ad hoc.
- Tokens primeiro: cores, sombras, raios e motion vêm de `app/styles/tokens.css`.
- Clareza de hierarquia: uma ação principal por contexto; apoio visual previsível.
- **Landing-first:** Páginas internas são extensão da landing (ritmo editorial, superfícies paper, sem sombras pesadas).
- **Tema:** Claro, escuro ou sistema (`prefers-color-scheme`); tokens `.dark` ativos em runtime quando aplicável. Ver `docs/THEME.md`.
- Acessibilidade: foco visível, contraste e reduced motion fazem parte do visual.
- Empty states: título claro + contexto curto + CTA principal (+ opcional secundário).
- Listas: separador sutil, hover leve; evitar cards dentro de cards.

## Tokens

**Arquivo:** `app/styles/tokens.css`

Papéis principais:

- **--bg, --surface, --surface-2:** fundo e superfícies (cream/paper no light).
- **--text, --muted:** texto principal e secundário.
- **--border:** bordas sutis.
- **--primary, --primary-foreground:** CTA dominante (ink no light); foreground = cream.
- **--accent, --accent-foreground:** destaque (laranja); hover do CTA primary.
- **--warning, --success, --danger:** estados (gold, verde, vermelho).
- **--radius-sm/md/lg/xl:** raios consistentes (10px, 14px, 18px, 24px).
- **--ui-*** variantes para superfícies, bordas e foco (ver blocos em `globals.css`).

Os tokens `.dark` em `app/styles/tokens.css` aplicam-se quando `<html>` tem a classe `.dark` (ver `lib/theme.ts`).

## Globals e utilitários

**Arquivo:** `app/globals.css`

### Layout (Landing UI inside the app)

- **ui-container:** max-width 1200px, padding responsivo (24px mobile, 48px desktop). Envolver conteúdo principal das páginas.
- **ui-section:** padding vertical generoso (28px mobile, 40px desktop).
- **ui-section-header:** stack para eyebrow + título + subtítulo (gap e margens consistentes).
- **ui-eyebrow:** label pequeno (12px, 600, uppercase, letter-spacing); cor accent ou muted.
- **ui-stack-lg / ui-stack-md:** gaps 24px e 16px em coluna.

### Superfícies e blocos

- **ui-panel:** superfície paper, borda sutil, radius 20px, sem sombra.
- **ui-panel-soft:** superfície mais suave, borda leve, radius 18px.
- **ui-feature-block:** container editorial (paper, borda sutil, radius 20px, padding 20–24px); hover translateY(-1px). Para blocos laterais (ex.: Lembretes, Email, Push em /today).
- **ui-feature-title:** título de bloco (12–13px, semibold/uppercase).
- **ui-feature-body / ui-feature-actions / ui-feature-meta:** corpo, ações e meta do bloco.
- **ui-empty-hero:** empty state editorial (padding generoso, center, sem sombra); usar com ui-empty-icon, ui-empty-title, ui-empty-subtitle, ui-empty-actions.
- **ui-list / ui-list-item:** listas leves (separador sutil, hover background leve); .ui-list-item .ui-panel remove borda/sombra do card interno.

### Ações e foco

- **ui-cta-primary:** CTA principal (ink no light, accent no hover); alinhado à landing.
- **ui-cta-secondary:** CTA secundário (borda sutil, paper).
- **ui-focus-surface:** foco visível consistente.

### Links, callouts, overlays

- **ui-link-tertiary / ui-link-tertiary-muted:** links de apoio.
- **ui-callout / ui-disclosure / ui-disclosure-summary:** blocos explicativos e detalhes colapsáveis.
- **ui-overlay-backdrop / ui-modal-surface:** overlay e superfície de modal.

### Shell e páginas

- **ui-page-shell / ui-page-shell-centered:** container de página.
- **ui-page-hero / ui-prose-panel:** hero e painel de prosa (borda sutil, sem sombra).
- **ui-title-editorial / ui-subtitle-editorial:** títulos e subtítulos no estilo landing.

### Badges e código

- **ui-badge-predefined / ui-badge-custom / ui-badge-usage:** badges de categorias/estado.
- **ui-code-block:** bloco de código/diagnóstico.

## Padrões de botões

- **Primário:** `ui-cta-primary` — ink (--primary), hover accent; radius e padding definidos no DS.
- **Secundário:** `ui-cta-secondary` — borda, fundo paper.
- Evitar overrides de cor (bg-accent, text-white) quando usar ui-cta-primary; o DS já define.

## Modais

- Backdrop: `ui-overlay-backdrop` (fixed inset-0, grid place-items-center).
- Superfície: `ui-modal-surface` (max-width, border, padding).

## Do / Don't

- **NÃO** usar cores hardcoded (amber, rose, emerald etc.); usar sempre tokens (`--primary`, `--accent`, `--warning`, etc.) de `app/styles/tokens.css`.
- **NÃO** usar sombras pesadas; preferir bordas sutis e `--shadow-sm`; sombras mais fortes só em hover quando definido no DS.
- **NÃO** criar sidebars como widgets soltos; usar **feature blocks** (`ui-feature-block`) na mesma coluna ou grid do conteúdo.

## Acessibilidade

- **Focus visível:** o DS define `:focus-visible` com ring (ex.: `--ui-focus-ring`); botões e links usam `ui-focus-surface` ou herdam o ring global. Não remover outline sem substituir por indicador visível.
- **Reduced motion:** quando aplicável, respeitar `prefers-reduced-motion`; duração e easing vêm de `app/styles/tokens.css` (`--dur-1`, `--dur-2`, `--ease`).

## Como validar

- `npm run build`
- `npx playwright test e2e/smoke.spec.ts`
- `npx playwright test e2e/screenshots-polish.spec.ts`

## Páginas já migradas (Landing UI)

- `app/(app)/today/page.tsx` — ui-container, ui-section-header, feature blocks, empty hero, ui-list.
- `app/(app)/manage/page.tsx` — ui-container, ui-section-header, ui-feature-block (stats), ui-empty-hero, ui-list.
- `app/(app)/share/page.tsx` — ui-container, ui-section-header, ui-empty-hero, ui-feature-block + ui-list.
- `app/(app)/share/[token]/page.tsx` — ui-container, ui-panel, ui-eyebrow.
- `components/LoginPageClient.tsx` — ui-container, ui-panel, ui-section-header.
- `app/(app)/upcoming/page.tsx` — section layout (ui-section-header quando aplicado).
- `app/(app)/person/page.tsx` — section layout (ui-container, ui-section-header quando aplicado).
- **Shell/nav:** `components/TopNav.tsx` (tema Claro/Escuro/Sistema + navegação). `components/AppShell.tsx` (banner PWA com ui-cta-primary).

## Como adicionar novo utilitário

1. Confirmar que o padrão não existe em `app/globals.css`.
2. Definir objetivo claro (semântica de uso).
3. Reusar tokens de `app/styles/tokens.css`.
4. Implementar estados (hover, focus-visible).
5. Validar em pelo menos 2 contextos.
6. Atualizar este arquivo e `SPEC.md`/`AGENTS.md` se virar contrato.

## Referências

- **Landing CSS:** `app/(marketing)/landing.css`
- **Filosofia de UI (guardrails):** `docs/PRODUCT_UI_PHILOSOPHY.md`
- **Rebrand report (section layout, identity diff):** `docs/REBRAND_LANDING_FIRST_REPORT.md`
- **Tema:** `docs/THEME.md`
- **Playbook de design:** `playbooks/design-skill.md`
