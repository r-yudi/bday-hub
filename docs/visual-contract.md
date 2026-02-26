# Visual Contract (Dark + DS)

## Objetivo
Contrato visual executável para manter o dark mode do Lembra. silencioso, legível e premium sem quebrar o modo claro.

## 1) Hierarquia de superfícies
- `--ui-bg`: fundo base da aplicação (deve recuar visualmente).
- `--ui-surface`: superfície padrão (cards simples, blocos neutros).
- `--ui-surface-elevated`: superfície de destaque (cards principais, filtros, painéis).
- `--ui-surface-overlay`: superfície de modal/overlay (maior contraste e isolamento).

Regra:
- Cada nível precisa ter diferença perceptível de `background + border + shadow`.
- Em dark, a hierarquia não pode depender só de opacidade.

## 2) Regra de elevação
- Base: `ui-surface`
- Destaque: `ui-surface-elevated` + border mais forte + `shadow-md`
- Overlay/Modal: `ui-modal-surface` com `--ui-surface-overlay` + `shadow-lg`

## 3) Regra de sombra (dark)
- Shadow em dark deve criar profundidade, não névoa.
- Preferir combinação de:
  - sombra principal escura (depth)
  - leve highlight interno/superior (micro-separação)
- Evitar blur excessivo colorido em cards utilitários.

## 4) Regra de focus
- Focus ring padrão usa `--ui-focus-ring`.
- `:focus-visible` deve ser visível em links, botões, tabs, filtros e inputs.
- Focus não pode depender só de mudança de cor de border.

## 5) Regra de tertiary link
- `ui-link-tertiary` = visível, elegante, sem parecer “muted”.
- Hover:
  - clareia o texto
  - mostra underline com contraste real
- `ui-link-tertiary-muted` pode ser mais discreto, mas não “apagado”.

## 6) Regra de callout / disclosure
- `ui-callout`: explicação técnica/ajuda contextual com superfície levemente elevada.
- `ui-disclosure`: container de detalhe colapsável com separação clara da superfície pai.
- `ui-disclosure-summary` deve parecer clicável (não texto morto).

## 7) Regra de badge (predefinida vs custom)
- `ui-badge-predefined`: neutro/read-only (superfície + border forte, sem competir com CTA).
- `ui-badge-custom`: acento/ativo (accent/primary, contraste claro).
- `ui-badge-usage`: badge de contagem/uso (warning/subtle; informativo, não prioritário).

## 8) Regra de empty state
- Empty state deve ter:
  - título claro
  - contexto curto
  - 1 CTA principal e opcionalmente 1 secundário
- Em dark, usar superfície previsível; não soltar texto direto no fundo.

## 9) Regra de CTA primário vs secundário
- Primário:
  - maior peso visual
  - contraste máximo
  - depth perceptível em dark
- Secundário:
  - aparência ativa (não parecer disabled)
  - border e highlight suficientes para affordance

## 10) Checklist visual obrigatório (antes de merge)
- [ ] Background dark recua e não compete com conteúdo.
- [ ] Superfícies têm hierarquia perceptível (`surface`, `elevated`, `overlay`).
- [ ] Texto principal/secundário permanece legível (AA mínimo).
- [ ] CTA secundário parece clicável, não desabilitado.
- [ ] Tertiary links estão visíveis e elegantes.
- [ ] Focus ring consistente em tabs, links, botões e filtros.
- [ ] Landing dark mantém impacto de headline + ilustração legível.
- [ ] `/manage` diferencia visualmente categoria predefinida vs custom.

