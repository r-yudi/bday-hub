# Landing Experimental — Calibração final (proporções exatas)

Valores numéricos para execução. Sem descrições vagas.

---

## 1) Largura real da massa (vw exato)

- **Desktop:** 78vw
- **Mobile:** 82vw
- **Altura da forma:** 100vh (desktop e mobile)

---

## 2) Quanto a massa nasce fora da viewport (%)

- **right: -28%** — 28% da largura da forma fica à direita da viewport
- **top: -18%** — 18% da altura da forma fica acima da viewport

Origem: canto superior direito. 28% da largura e 18% da altura “nascem” fora.

---

## 3) Largura real da ribbon (% e espessura)

- **Cobertura:** width 115% do viewport, left -7.5% (atravessa de ponta a ponta)
- **Ângulo:** -32deg (fixo)
- **Posição vertical (top):** 40% do viewport

**Espessura (px):**

| Tema  | Desktop | Mobile |
|-------|---------|--------|
| Light | 12px    | 8px    |
| Dark  | 8px     | 6px    |

---

## 4) Percentual de deslocamento da headline

- **Headline (bloco de copy):** left 9%, top 40%
- **Subheadline:** margin-top 0.75rem (12px)
- **CTA:** margin-top 1.5rem (24px)

---

## 5) Quanto do shape é cortado no mobile

- Massa no mobile: 82vw (≈ 320px em 390px viewport)
- **right: -28%** → ~22% da largura total da forma fica fora à direita
- **top: -18%** → ~18% da altura da forma fica acima da viewport

**Resumo numérico:** 22% da largura e 18% da altura do shape são cortados (fora da viewport) no mobile.

---

## 6) Quantidade máxima de partículas por tema

- **Light:** 6 partículas (máximo). Tamanhos: 28px, 32px, 36px, 40px (mix)
- **Dark:** 5 partículas (máximo). Tamanhos: 24px, 28px, 32px, 36px (mix)

---

## 7) Light: 1 cor dominante + 1 corte

- **1 cor dominante:** Zona B (bloco direito) = uma única cor sólida: `hsl(12 95% 45%)` (coral). Sem gradiente.
- **1 corte:** Ribbon = uma única cor sólida: `hsl(35 98% 52%)` (amarelo) ou `hsl(0 0% 8%)` (preto). Uma linha, uma cor.

Confirmado: Light = 1 cor dominante (coral) + 1 corte (ribbon sólida).

---

## 8) Dark: 1 luz principal + 1 glow secundário

- **1 luz principal:** Spotlight atrás da headline — radial, centro no copy, `hsl(12 60% 55% / 0.22)`. Pool of light.
- **1 glow secundário:** Borda/gradiente da massa — `hsl(12 80% 60% / 0.5)` na borda da forma, ou gradiente no centro `hsl(12 75% 55% / 0.35)` → transparente.

Confirmado: Dark = 1 luz principal (spotlight) + 1 glow secundário (massa/borda).
