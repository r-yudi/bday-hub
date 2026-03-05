# Product UI Philosophy — guardrails contra UI drift

Propósito: definir guardrails para manter a UI do Lembra. consistente com o rebrand "Landing UI inside the app" e evitar deriva (novos padrões ad hoc, sombras pesadas, hierarquia quebrada).

## Filosofia (10 bullets)

- **Landing-first:** O app interno é continuação da landing; mesma linguagem visual (cream/paper, ink, accent).
- **Ritmo editorial:** Eyebrow + título editorial (serif) + subtítulo; uma ideia por seção.
- **UI calma:** Menos ruído visual; uma ação principal por contexto; apoio discreto (links tertiary, callouts).
- **Superfícies paper:** Cards e blocos com borda sutil, radius consistente, sem sombras pesadas.
- **Sombras mínimas:** Preferir `--shadow-sm`; sombras mais fortes só onde o DS define (ex.: hover em feature-block).
- **Hierarquia consistente:** Títulos com `ui-title-editorial` / `ui-subtitle-editorial`; labels com `ui-eyebrow`.
- **Empty states como hero:** Empty = `ui-empty-hero` com ícone, título, subtítulo e ações (não só texto solto).
- **Feature blocks em vez de sidebars:** Conteúdo lateral em blocos editoriais (`ui-feature-block`), não widgets soltos em coluna separada.
- **Listas com separadores leves:** `ui-list` / `ui-list-item`; hover leve; evitar cards dentro de cards.
- **Light-only (pre-launch):** Apenas tema claro ativo; sem toggle de tema. Ver [docs/THEME.md](docs/THEME.md).

## Golden Rules (5)

1. **Use sempre utilitários `ui-*`** (em `app/globals.css`) antes de criar classes ad hoc.
2. **Tokens para cor, sombra e raio** — nada de cores ou sombras hardcoded; usar `app/styles/tokens.css`.
3. **Uma ação principal por contexto** — CTA dominante com `ui-cta-primary`; secundários com `ui-cta-secondary`.
4. **Empty = hero** — título claro + contexto curto + CTA principal (+ opcional secundário) em `ui-empty-hero`.
5. **Validar com build + smoke + screenshots** — `npm run build`, `npx playwright test e2e/smoke.spec.ts`, `npx playwright test e2e/screenshots-polish.spec.ts`.

## Exemplos práticos (antes / depois)

- **Antes:** Sidebar com widgets soltos (cards, botões desconexos). **Depois:** `ui-feature-block` na mesma coluna ou grid do conteúdo (ex.: Lembretes/Email em /today).
- **Antes:** Empty state só com texto "Nenhum item". **Depois:** `ui-empty-hero` com ícone, título, subtítulo explicativo e botão principal (ex.: "Adicionar aniversário").
- **Antes:** Lista de itens com cards pesados (sombra + borda forte em cada um). **Depois:** `ui-list` + `ui-list-item`; dentro do item, `ui-panel` sem borda/sombra pesada (o list-item já dá separador e hover).
- **Antes:** Página sem hierarquia clara (título genérico + conteúdo). **Depois:** `ui-section-header` com `ui-eyebrow` + `ui-title-editorial` + `ui-subtitle-editorial`; depois o conteúdo em `ui-section`.
- **Antes:** Botão "Salvar" com `bg-accent text-white` ou classe Tailwind solta. **Depois:** `ui-cta-primary` (ou `ui-cta-secondary`) para manter consistência com a landing.

## Referências

- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) — contrato completo, tokens, utilitários, Do/Don't
- [docs/THEME.md](docs/THEME.md) — light-only
- [docs/REBRAND_LANDING_FIRST_REPORT.md](docs/REBRAND_LANDING_FIRST_REPORT.md) — section layout, identity diff
