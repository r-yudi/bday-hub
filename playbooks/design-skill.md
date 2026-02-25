# Design Skill Playbook (Lembra.)

## Objetivo
Evoluir a UI com consistência e intenção de produto, usando o design system existente como fonte única e evitando regressões visuais/UX.

## Fonte única do design system (obrigatório)
- Tokens: `app/styles/tokens.css`
- Utilitários globais `ui-*`: `app/globals.css`
- Guia resumido do repo: `DESIGN_SYSTEM.md`
- Contexto de produto: `PRD.md`, `SPEC.md`, `AGENTS.md`

## Contrato visual (regras)
### 1) Use `ui-*` antes de criar classes ad hoc
Preferir utilitários existentes, especialmente:
- Superfícies/níveis: `ui-surface`, `ui-surface-elevated`, `ui-border-subtle`, `ui-backdrop`
- Ações/CTAs: `ui-cta-primary`, `ui-cta-secondary`, `ui-focus-surface`
- Links terciários: `ui-link-tertiary`, `ui-link-tertiary-muted`
- Explicações técnicas: `ui-callout`, `ui-disclosure`, `ui-disclosure-summary`
- Overlays/modais: `ui-overlay-backdrop`, `ui-modal-surface`
- Shells/páginas: `ui-page-shell`, `ui-page-shell-centered`
- Tipografia/estado: `ui-title-editorial`, `ui-subtitle-editorial`, `ui-inline-status`

### 2) Tokens são a fonte de cor/raio/sombra/motion
- Não inventar cores fora de `app/styles/tokens.css`.
- Reusar `--radius-*`, `--shadow-*`, `--dur-*`, `--ease`.
- Dark mode deve usar os tokens `--ui-*` e manter contraste/superfícies previsíveis.

### 3) Foco e teclado são parte do visual
- `:focus-visible` deve ser visível e consistente.
- Se criar padrão interativo novo, prever estado hover, active e focus.

### 4) Overlays e modais
- Usar `ui-overlay-backdrop` + `ui-modal-surface`.
- Evitar modais “caixudos” sem blur/nível visual quando o DS já cobre isso.

### 5) Callouts e disclosures
- Explicações, limitações e detalhes técnicos devem usar `ui-callout` e/ou `ui-disclosure`.
- Links quiet/terciários devem usar `ui-link-tertiary` ou `ui-link-tertiary-muted`.

## Escada de hierarquia (texto e ações)
Use esta hierarquia para reduzir ruído e dar direção:

1. `H1` (headline principal)
- Uma mensagem por tela/bloco.
- Preferir tom objetivo + benefício.

2. `Sub` (subheadline/contexto)
- Explica o “como/por quê” em 1-3 linhas.
- Não competir com H1.

3. `CTA` (ação principal)
- Uma ação dominante por contexto.
- Preferir `ui-cta-primary`.

4. `Secondary` (ação de apoio)
- Alternativas úteis, menos dominantes.
- Preferir `ui-cta-secondary` ou `ui-focus-surface`.

5. `Tertiary` (links quiet)
- Navegação auxiliar, ajuda, ações reversíveis leves.
- Usar `ui-link-tertiary` / `ui-link-tertiary-muted`.

6. `Muted` (metadados/estado)
- Texto de suporte, timestamps, explicações curtas.
- Usar cor/mix do DS; evitar diminuir contraste além do legível.

## Checklist de acessibilidade (mínimo)
- [ ] Navegação por teclado funciona (tab order coerente).
- [ ] `focus-visible` aparece em links, botões e controles.
- [ ] Contraste suficiente em light e dark (texto/ícones/bordas relevantes).
- [ ] Estados hover não são a única pista de interação.
- [ ] `prefers-reduced-motion` respeitado para animações novas.
- [ ] Ícones sem texto têm `aria-label` quando necessário.
- [ ] Overlays/modais mantêm foco e leitura clara.

## Processo de UI Polish Pass
Aplicar depois que a tela já funciona.

### O que pode (polish seguro)
- Ajustar hierarquia visual (peso, espaçamento, contraste, alinhamento).
- Trocar classes ad hoc por `ui-*`.
- Refinar estados de hover/focus/active.
- Melhorar densidade/respiração sem mudar fluxo.
- Melhorar copy curta (labels/CTA) sem alterar lógica.
- Melhorar dark mode usando tokens e superfícies do DS.

### O que não pode (sem alinhamento)
- Mudar regra de negócio/fluxo de produto “disfarçado” de UI.
- Introduzir novos padrões visuais ignorando tokens/utilitários existentes.
- Quebrar seletores de smoke E2E por renome visual descuidado.
- Inserir animações excessivas ou ignorar reduced motion.
- Reescrever componente inteiro se um ajuste local resolve.

## Anti-patterns (evitar)
- Voltar para visual “caixudo”/genérico sem hierarquia de superfícies.
- Inventar cores/sombras fora dos tokens.
- Duplicar classes utilitárias já existentes em `ui-*`.
- Misturar padrões de botão/link no mesmo contexto sem hierarquia clara.
- Usar texto mutado demais em conteúdo principal (contraste baixo).
- Criar overlay/modal sem `ui-overlay-backdrop`/`ui-modal-surface`.
- Espalhar ajustes visuais sem atualizar docs quando virar padrão.

## Critérios de aceite (design)
- A UI respeita o contrato visual e reutiliza `ui-*` quando aplicável.
- Light/dark mode mantêm coerência e legibilidade.
- Estados de foco e teclado seguem visíveis.
- Copy e hierarquia visual deixam clara a ação principal.
- Não houve regressão perceptível em landing, app shell ou fluxos tocados.

## Como rodar este playbook (fluxo rápido)
1. Ler `PRD.md`, `SPEC.md`, `AGENTS.md`.
2. Ler `DESIGN_SYSTEM.md` + conferir `app/styles/tokens.css` e `app/globals.css`.
3. Definir objetivo visual do ajuste (hierarquia, clareza, contraste, consistência).
4. Implementar usando `ui-*`/tokens primeiro.
5. Fazer `UI polish pass` (seguro).
6. Checar checklist de acessibilidade.
7. Atualizar `DESIGN_SYSTEM.md` se criar novo utilitário `ui-*`.
