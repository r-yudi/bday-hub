# DECISIONS — Memória estratégica (Lembra)

Registro de decisões estruturais e de escopo. Fonte: processo PIPELINE e discussões de produto.

---

## Governança
- **MANIFESTO vence** em conflito com PRD. Fontes obrigatórias: MANIFESTO.md, docs/PIPELINE.md, docs/DECISIONS.md, PRD.md, SPEC.md, DESIGN_SYSTEM.md, docs/visual-contract.md, tokens.css, globals.css, playbooks (product/design/dev).
- Processo por etapas com pós-mortem ao final de cada fase; decisões registradas aqui.

---

## Etapa 1 — Ruptura visual hero
- Escopo estrito: apenas hero/landing (LandingPremiumPageClient, LandingCelebrationScene, TopNav quando isLanding, globals.css para landing). Zero alteração em lógica, repositórios, rotas internas (/today, /manage, /person).
- Critério "produto vivo": energia, celebração, impacto; ilustração e elementos de celebração (confetes, balões) legíveis em tema claro e escuro.
- Hero: uma mensagem principal acima da dobra; CTA primário dominante; CTA secundário claro mas subordinado; fundo com profundidade elegante; zero poluição visual.

**Pós-mortem Etapa 1:** Concluída. Scaffold criou PIPELINE.md, DECISIONS.md e MANIFESTO.md. Wire: hero com CTA dominante (landing-cta-dominant), CTA de apoio (landing-cta-support), ilustração com classe hero-art-illustration e estilos dark (contraste, drop-shadow), headline/subheadline com hierarquia clara. Polish: focus-visible para CTAs da landing, grid acima da dobra reduzido (opacity 30/15). Harden: build e testes passando; correção pré-existente no cron email (tipos Supabase user_settings) para build passar. Nenhuma regressão em /today, /manage, /person; escopo restrito à landing.

---

## Etapa 2 — Web Push MVP
- **Escopo:** Client-only. Notificação local (Notification API) quando o app está aberto ou ao abrir o app; no dia do aniversário só dispara a partir do horário escolhido (notificationTime). Uma notificação por dia (dedupe por lastNotifiedDate em settings locais). Deep link: clique na notificação abre /today.
- **Onde ativa:** /today, seção Lembretes. Permissão explícita; escolha de horário (time input); estados: ativado / desativado / permissão negada / não suportado.
- **Compatibilidade:** Guest e logado usam o mesmo fluxo (storage local/IDB). Email diário continua separado (logado, servidor).
- **Limitações:** iOS/Safari e alguns navegadores não suportam a Notification API ou restringem em PWA; documentado na UI (detalhes técnicos) e aqui.
- **Pós-mortem Etapa 2:** Implementado: maybeNotifyTodayBirthdays respeita notificationTime e deep link (onclick → /today); time picker em /today; toggle ativar/desativar; periodic check (60s) no AppShell para disparar no horário com app aberto. Decisão: sem VAPID/servidor; MVP apenas notificação local.

---

## Etapa 3 — Consolidação UI V2
- Padrão Series A aplicado a /today e /manage: hierarquia mais agressiva (título de seção > conteúdo > ações), CTA primário dominante por contexto, empty states celebratórios (título forte + contexto + 1 CTA principal, opcional secundário).
- **Pós-mortem Etapa 3:** /today: empty state “Hoje sua lista está tranquila” com mais respiro (p-8/p-10), título em h2, CTA “Adicionar agora” dominante (min-width, font-semibold, focus ring). /manage: empty states com ícone, título claro, um CTA principal (“Adicionar aniversário” ou “Limpar filtros”); respiro aumentado (space-y-8); CTAs do header com focus ring. Não é redesenho total; harmonização alinhada ao hero.

---

## Rodada V2 — Governança (tese "Estar presente é celebrar")
- **Skill líder:** design-skill (hero = composição, hierarquia, tokens, contrato visual).
- **Copy congelada:** headline "Estar presente é celebrar."; CTA "Quero aparecer no dia" (logado: "Continuar no app"); apoio ≤12 palavras: "A gente te avisa no dia. Você celebra."
- **Escopo:** doc `MANIFESTO_UI_COPY.md`, hero rupture UI-only, confetti/balloon visibility light+dark, `/manage` consistência (tablist + badges). Sem Web Push, sem alteração de arquitetura/auth/sync, sem novas libs.
- **Aprendizados:** (1) Congelar headline/CTA/apoio num doc north-star evita deriva em revisões. (2) Confetti/balões em light exigem opacidade maior nos strokes (--text/0.38–0.42) que em dark. (3) Tablist em /manage com shadow-md alinha elevação ao restante dos cards sem mudar contrato.

---

## Hero Side Blast (abandono Orbit)
- **Decisão:** Abandonar conceito Orbit (hero centralizado, ilustração abaixo da dobra). Adotar Hero Side Blast Dramático: composição assimétrica, ilustração >= 35% na dobra, radial spotlight atrás do copy, glow quente lateral, confetti atravessando e invadindo a headline; mobile não centralizado.
- **Prova visual obrigatória:** 8 screenshots (desktop/mobile × light/dark × fullpage + hero fold) em `test-results/visual-regression/`; paths listados em `e2e/visual-regression.spec.ts` e em `docs/VISUAL_PROOF_PROTOCOL.md`.

---

## Hero Radial Cut Explosion (abandono hero ilustrativo)
- **Decisão:** Abandonar qualquer hero ilustrativo (personagens, outdoor-party). Adotar hero “Radial Cut Explosion”: abstração pura; forma principal >= 60vw nascendo fora da viewport (canto superior direito); orbs com blur profundo; pelo menos uma ribbon diagonal cruzando a tela; confete mínimo porém maior (partículas 12–24px); spotlight radial atrás da headline; headline com sobreposição leve à massa; mobile como corte de pôster (não SaaS minimal).
- **Playbook:** Regra “Anti-hero minimalista” em `playbooks/design-skill.md`: exigir elemento de escala/composição ousada e validar com proof visual.

---

## Hero Experimental Lab (/campaign)
- **Decisão:** Rota isolada `/campaign` para testar ruptura visual Series A sem alterar a landing atual. Full-bleed 100vh; AppShell em `/campaign` renderiza apenas `children` (sem TopNav/main wrapper).
- **Copy fixa:** Headline "Quem se importa, aparece."; sub "O Lembra te encontra no dia. Você só celebra."; CTA "Me avisar no dia"; link "Já tenho conta".
- **Visual Light:** Amarelo energético dominante (zona B + massa), 1 cor dominante + 1 corte (ribbon sólida). Proporções em `docs/LANDING_EXPERIMENTAL_CALIBRATION.md`.
- **Visual Dark:** Cinematográfico, quase preto + pool of light (spotlight atrás da copy), 1 luz principal + 1 glow secundário (massa/borda).
- **Prova visual:** 8 screenshots em `test-results/visual-regression/exp-*` (desktop/mobile × light/dark × fullpage + hero). Paths em `e2e/visual-regression.spec.ts` e `docs/VISUAL_PROOF_PROTOCOL.md`.
- **Critério de promoção:** Se aprovado, considerar substituir hero da landing ou manter como variante A/B; decisão posterior.
