# Rebrand Landing-First — Relatório de Referências e Identity Diff

## PARTE 1 — Referências extraídas

### 1) Landing CSS (app/(marketing)/landing.css — escopo .landing)

#### Cores/tokens (landing)
```css
.landing {
  --cream: #faf8f3;
  --ink: #1a1410;
  --ink-mid: #4a3f35;
  --ink-soft: #8c7b6e;
  --warm-white: #ffffff;
  --accent: #e85d26;
  --accent-soft: #f4845a;
  --dark: #0f0d0a;
  --dark-card: #1c1a16;
  --border: rgba(26, 20, 16, 0.1);
  --border-dark: rgba(255, 255, 255, 0.1);
  --gold: #c9973a;
  font-family: var(--font-dm-sans), sans-serif;
  background: var(--cream);
  color: var(--ink);
}
```

#### Nav
```css
.landing nav {
  background: rgba(250, 248, 243, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}
.landing .nav-cta {
  background: var(--ink);
  color: var(--cream) !important;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px; font-weight: 500;
}
.landing .nav-cta:hover {
  background: var(--accent) !important;
  transform: translateY(-1px);
}
```

#### Botões (hero / primary-secondary)
```css
.landing .btn-primary {
  background: var(--ink);
  color: var(--cream);
  padding: 14px 28px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  border: none;
  transition: background 0.15s ease, transform 0.15s ease;
}
.landing .btn-primary:hover {
  background: var(--accent);
  transform: translateY(-2px);
}
.landing .btn-secondary {
  color: var(--ink-mid);
  font-size: 15px;
  font-weight: 500;
  transition: color 0.15s ease;
}
.landing .btn-secondary:hover { color: var(--ink); }
```

#### Tipografia (headings)
```css
.landing h1 {
  font-family: var(--font-dm-serif), serif;
  font-size: clamp(40px, 5vw, 60px);
  line-height: 1.08;
  letter-spacing: -1.5px;
  color: var(--ink);
}
.landing h2 {
  font-family: var(--font-dm-serif), serif;
  font-size: clamp(32px, 4vw, 48px);
  letter-spacing: -1px;
  line-height: 1.1;
  color: var(--ink);
}
.landing h3 {
  font-family: var(--font-dm-serif), serif;
  font-size: 22px;
  letter-spacing: -0.3px;
  color: var(--ink);
}
.landing .hero-sub, .landing .section-sub {
  font-size: 17px;
  line-height: 1.7;
  color: var(--ink-mid);
}
```

#### Superfícies/cards
```css
.landing .feature-card {
  background: var(--cream);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 32px 28px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.landing .feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(26, 20, 16, 0.08);
}
.landing .birthday-card {
  background: var(--warm-white);
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.landing .pill {
  border-radius: 100px;
  border: 1px solid var(--border);
  background: var(--warm-white);
}
```

#### Bordas / radius
- Nav CTA: 8px; btn-primary: 10px; feature-card: 20px; birthday-card: 14px; pill: 100px; btn-cta-big: 12px.

#### Sombras
- feature-card hover: `0 20px 40px rgba(26, 20, 16, 0.08)`
- check-item hover: `0 4px 20px rgba(26, 20, 16, 0.06)`
- phone-wrap: `drop-shadow(0 40px 80px rgba(26, 20, 16, 0.18))`

---

### 2) App DS — tokens (app/styles/tokens.css)

#### :root (light)
```css
--bg: 40 35% 96.5%;
--surface: 40 45% 99%;
--surface-2: 36 35% 95%;
--text: 24 25% 10%;
--muted: 28 12% 40%;
--border: 30 18% 88%;
--primary: 16 82% 53%;
--primary-foreground: 0 0% 100%;
--accent: 162 64% 43%;
--lilac: 266 90% 72%;
--danger: 0 78% 56%;
--warning: 38 55% 52%;
--success: 152 62% 40%;
--radius-sm: 10px; --radius-md: 14px; --radius-lg: 18px; --radius-xl: 24px;
--shadow-sm: 0 1px 2px rgba(26, 20, 16, 0.06);
--shadow-md: 0 8px 24px rgba(26, 20, 16, 0.08);
--shadow-lg: 0 16px 40px rgba(26, 20, 16, 0.1);
```

#### .dark
```css
--bg: 20 18% 9%;
--surface: 22 18% 13%;
--text: 40 30% 96%;
--primary: 16 85% 58%;
--accent: 162 64% 47%;
--warning: 38 58% 58%;
```

---

### 3) App DS — utilitários identidade (app/globals.css)

- **body:** `bg-background text-text` + background-image (4 radial-gradients) + `body::before` (grid 38px, text/0.025).
- **ui-cta-primary:** bg primary, shadow-sm, hover translateY(-1px) + shadow-lg, focus ring 2px+5px.
- **ui-cta-secondary:** border ui-border-strong, gradient surface-elevated/surface, shadow 3px 12px + inset.
- **ui-panel:** gradient surface-elevated/surface, border ui-border-strong, shadow-md + inset.
- **ui-panel-soft:** gradient surface/surface, border ui-border-subtle, shadow-sm + inset.
- **ui-surface:** background-color ui-surface/0.9, border ui-border-subtle.
- **ui-surface-elevated:** gradient surface-elevated/surface, border ui-border-strong, shadow-md.
- **ui-page-hero:** radius-xl, border ui-border-subtle, radiais (warning/lilac) + gradient surface-elevated/surface, shadow-sm.
- **ui-title-editorial:** font-display, weight 600, letter-spacing -0.025em, line-height 0.96, color text.
- **ui-subtitle-editorial:** font-sans, color muted/0.95, line-height 1.58.
- **topnav-shell:** gradient surface/surface, border, box-shadow 8px 22px + inset -1px 0; ::before radiais warning/primary/lilac.
- **app-shell-main:** position relative; ::before height 8rem, radiais warning/primary/lilac (gradient no topo).

---

## Identity Diff Report

| Aspecto | Landing (valor/estilo) | App (valor/estilo atual) | Gap | Ação proposta |
|--------|------------------------|---------------------------|-----|----------------|
| **Background** | Cream sólido `#faf8f3` (.landing); sem grid global | body com 4 radial-gradients + grid (body::before) | App mais “colorido” e com grid em todo viewport | Tokens --bg/--surface = cream/paper; mover gradientes+grid para .app-shell-wrap ou remover do body e deixar mínimo |
| **CTA primary** | Ink pill: bg ink, color cream, radius 10px, hover accent + translateY(-2px), sem sombra pesada | Laranja (--primary), shadow-sm/lg, hover lift 1px + scale | App = laranja; landing = ink → cream | Reatribuir --primary = ink; --primary-foreground = cream; ui-cta-primary = pill ink, shadow mínima, hover lift discreto |
| **CTA secondary** | Neutro: color ink-mid, sem borda forte, hover ink | Borda forte, gradient surface, sombra 3px 12px + inset | App mais “pesado” | ui-cta-secondary: borda sutil, fundo paper (surface), estilo neutro como landing .btn-secondary |
| **Card surface** | Borda 1px var(--border), radius 14–20px, sombra só no hover (0 20px 40px 0.08) | ui-panel: gradient, border strong, shadow-md + inset | App com mais gradiente e sombra | ui-panel / ui-surface-elevated: bordas mais sutis, sombras reduzidas, fundo mais paper (menos gradiente) |
| **Typography scale** | h1 clamp 40–60px, serif, -1.5px; h2 32–48px, -1px; body 17px 1.7 | ui-title-editorial: font-display 600 -0.025em 0.96; ui-subtitle-editorial muted 1.58 | Semelhante; landing mais “hero” | Garantir ui-title-editorial com tracking/line-height próximo ao hero (letter-spacing -0.02em a -0.03em, line-height ~1.08 para títulos grandes) |
| **Borders/radius** | 8–10px botões; 14–20px cards; 100px pills | radius-sm 10, md 14, lg 18, xl 24 | Alinhado | Manter tokens; usar radius consistente em panels (xl para hero, lg para cards) |
| **Shadows** | Discretas: hover 0 20px 40px 0.08; 0 4px 20px 0.06 | shadow-sm/md/lg mais presentes em superfícies e CTAs | App mais “elevado” | Reduzir sombras em ui-panel, ui-surface-elevated, ui-page-hero; shadow-sm como padrão, md só hover ou hero |

---

## Resumo das ações (Parte 2)

1. **tokens.css:** --bg/--surface = cream/paper; --text = ink quente; --primary = ink (CTA dominante); --primary-foreground = cream; --accent = laranja (#e85d26); --warning = gold; danger/success consistentes; .dark equivalentes quentes.
2. **globals.css:** ui-cta-primary = pill ink, shadow mínima, hover discreto; ui-cta-secondary = neutro borda sutil + paper; ui-panel / ui-surface / ui-surface-elevated / ui-page-hero = menos sombra e gradiente, bordas sutis, fundo paper; ui-title-editorial = serif + tracking/line-height tipo hero; body = sem grid/gradientes fortes (ou só --bg); .app-shell-wrap = receber gradientes leves (só para internas).

---

## Landing UI inside the app — Section layout reference

(Extraído de app/(marketing)/landing.css para aplicar ritmo editorial nas páginas internas.)

### Container principal
- **.landing .container:** max-width 1200px; margin 0 auto.
- **.landing section:** padding 96px 48px (desktop). @media (max-width: 900px): padding 64px 24px.

### Section header (eyebrow + título + subtítulo)
- **.section-eyebrow:** font-size 12px; font-weight 600; letter-spacing 1px; text-transform uppercase; color var(--accent); margin-bottom 16px.
- **h2:** font-family var(--font-dm-serif); font-size clamp(32px, 4vw, 48px); letter-spacing -1px; line-height 1.1; color var(--ink); margin-bottom 20px.
- **.section-sub:** font-size 17px; line-height 1.7; color var(--ink-mid); max-width 520px; margin-bottom 64px.

### Feature card (superfície “paper”)
- **.feature-card:** background var(--cream); border 1px solid var(--border); border-radius 20px; padding 32px 28px; transition transform/box-shadow 0.15s.
- **.feature-card:hover:** transform translateY(-4px); box-shadow 0 20px 40px rgba(26, 20, 16, 0.08).
- **.birthday-card:** border-radius 14px; padding 14px; border 1px solid rgba(0, 0, 0, 0.06).

### Gaps e stacks
- Hero actions: gap 16px. Cards grid: gap 24px. Section header: eyebrow mb 16px; h2 mb 20px; sub mb 64px.
