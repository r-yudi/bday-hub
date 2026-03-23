# Visual Contract (Dark + DS)

**Nota:** O app suporta **claro, escuro e sistema** em runtime (`.dark` no `<html>` quando resolvido). Ver `docs/THEME.md`.

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

## 8.1) Regra de ilustração festiva (landing)
- Confetes e fios dos balões precisam permanecer aparentes em **light e dark**.
- Se a arte base perder contraste no light, usar overlay leve (confete/ribbons) com contraste controlado.
- Priorizar legibilidade da arte sem “lavar” o fundo da hero.

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
- [ ] Landing light mantém confetes e fios aparentes (sem sumir no fundo claro).
- [ ] `/manage` diferencia visualmente categoria predefinida vs custom.
- [ ] Screenshots de regressão (desktop/mobile, claro/escuro) gerados para telas tocadas.

## 11) Regra de hero (Series A)
- Hero precisa comunicar uma única promessa por viewport.
- Headline dominante com contraste de escala claro vs subheadline.
- CTA primário deve ser o elemento mais forte da dobra inicial.
- CTA secundário precisa ser claro, mas visualmente subordinado ao primário.
- Evitar excesso de elementos simultâneos (efeitos, chips, blocos concorrentes).

## 12) Regra de autoridade visual
- Priorizar alinhamento e ritmo vertical antes de adicionar efeitos.
- Cada seção principal precisa de uma âncora (título, métrica ou CTA) com prioridade inequívoca.
- Reduzir variação arbitrária de card: menos estilos, mais previsibilidade.
- Se houver dúvida entre “mais efeito” e “mais clareza”, escolher clareza.

## 13) Empty states em /today e /manage (Series A)
- Formato: título forte (h2) + contexto curto + 1 CTA principal dominante + opcional CTA secundário.
- Respiro: padding generoso (p-8 sm:p-10) e ícone/emoji como âncora visual.
- CTA primário com peso visual claro (font-semibold, shadow, focus ring); evitar aparência de painel genérico.
