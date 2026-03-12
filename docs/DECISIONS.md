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

## Divergência PRD vs SPEC (email diário) — resolvida

- **Situação:** O PRD listava "Sem push/email/cron neste baseline" e "Notificações confiáveis (push/email/cron)" como fora de escopo; a SPEC 7.1 já descrevia e o código já tinha email diário agendado em produção (`/api/cron/email`).
- **Decisão:** A feature existe no código e em produção; o trabalho foi **hardening operacional**, não expansão de escopo. O PRD foi atualizado para incluir "Email diário agendado" em 5.1 e remover a linha "Sem push/email/cron" de 5.2; a SPEC 7.1 permanece a referência de implementação. Nenhuma "vitória" de um doc sobre o outro — alinhamento explícito: feature entregue, doc corrigido.
- **Limitações conhecidas:** Diagnóstico em produção requer CRON_SECRET; filtro por userId só para UUIDs em CRON_TEST_USER_ID; dry-run é 100% read-only (nenhum envio, nenhuma escrita).

---

## Hero Experimental Lab (/campaign)
- **Decisão:** Rota isolada `/campaign` para testar ruptura visual Series A sem alterar a landing atual. Full-bleed 100vh; AppShell em `/campaign` renderiza apenas `children` (sem TopNav/main wrapper).
- **Copy fixa:** Headline "Quem se importa, aparece."; sub "O Lembra te encontra no dia. Você só celebra."; CTA "Me avisar no dia"; link "Já tenho conta".
- **Visual Light:** Amarelo energético dominante (zona B + massa), 1 cor dominante + 1 corte (ribbon sólida). Proporções em `docs/LANDING_EXPERIMENTAL_CALIBRATION.md`.
- **Visual Dark:** Cinematográfico, quase preto + pool of light (spotlight atrás da copy), 1 luz principal + 1 glow secundário (massa/borda).
- **Prova visual:** 8 screenshots em `test-results/visual-regression/exp-*` (desktop/mobile × light/dark × fullpage + hero). Paths em `e2e/visual-regression.spec.ts` e `docs/VISUAL_PROOF_PROTOCOL.md`.
- **Critério de promoção:** Se aprovado, considerar substituir hero da landing ou manter como variante A/B; decisão posterior.

---

## Onboarding — sugestões de memória (passo Adicionar aniversários)
- **Problema:** Chips (Parceiro(a), Melhor amigo, etc.) pareciam prometer fluxo especial ou autofill; rodapé do passo com hierarquia visual fraca.
- **Decisão (abordagem B):** Chips deixam de ser clicáveis e viram apenas apoio visual/copy. Microcopy: "Sugestões para te ajudar a lembrar:" + "Parceiro(a), melhor amigo, mãe ou pai… pense em quem você pode adicionar primeiro." Ação única de adicionar: link "Adicionar pessoa"; secundário: "Pular por agora". Rodapé em coluna (flex-col gap-3), botões com w-full para alinhamento claro.
- **Rationale:** Abordagem B é mais honesta (não gera expectativa de preenchimento automático) e mais simples (uma só ação principal). Arquivo: `components/onboarding/OnboardingGate.tsx`.

---

## Divergência /login dev vs produção — causa e correção

- **Problema:** Em produção a tela `/login` aparecia mais simples que em desenvolvimento (menos contexto de confiança, layout diferente).
- **Investigação:** No repositório existe uma única árvore para `/login`: `app/(app)/login/page.tsx` → `LoginPageClient`. Não há condicional por ambiente, feature flag nem fallback que altere a UI em produção. A versão completa aprovada (título "Sincronize seus aniversários", DataDisclosure, PrivacyReassurance, links) está em `components/LoginPageClient.tsx`.
- **Causa provável:** Deploy/branch incorreta ou build desatualizado em produção (ex.: Vercel publicando branch ou commit antigo). Não é explicada por código de UI.
- **Ação operacional (obrigatória):** (1) No painel do Vercel (ou CI), confirmar qual **branch** e qual **commit SHA** estão publicados em produção. (2) Comparar com o commit que contém a versão correta de `LoginPageClient` (ex.: branch `main` ou `release/rebrand-landing-ui` e HEAD local). (3) Se produção estiver defasada: fazer **redeploy da branch correta**; validar `/login` após o deploy. (4) Comparar `/login` em dev, build local (`npm run build && npm run start`) e produção; a mesma composição deve aparecer nos três.
- **Baseline:** A versão canônica da tela `/login` é a atual `LoginPageClient.tsx`: header editorial, botão Continuar com Google, blocos "O que será compartilhado" e "O que NÃO acessamos", links Privacidade e Termos. Referência de copy/confiança: `docs/GOOGLE_LOGIN_TRUST_MITIGATION_WITHOUT_CUSTOM_DOMAIN.md`.
- **Decisão link Diagnóstico:** Em produção a rota `/debug/*` retorna 404 (layout de debug bloqueia em `NODE_ENV === "production"`). O link "Diagnóstico" em `/login` levaria a link morto. **Decisão:** ocultar o link "Diagnóstico" quando `NODE_ENV === "production"` em `LoginPageClient.tsx`; mantê-lo visível em desenvolvimento. Nenhuma outra alteração de auth ou fluxo de login.

---

## Consolidação arquitetural da rota /login (fonte única de verdade)

- **Objetivo:** Garantir que /login use uma única implementação canônica e que produção reflita exatamente essa implementação. Tratado como problema de consolidação arquitetural, não apenas deploy/cache.
- **Auditoria realizada:** (1) Rotas: existe apenas `app/(app)/login/page.tsx`; não há `app/login/page.tsx` nem outra page que responda por /login. (2) Componentes: apenas `components/LoginPageClient.tsx` implementa a UI completa de login; LandingPageClient e outros apenas linkam para `/login`. (3) Layouts: `app/(app)/layout.tsx` envolve com AppShell; não há layout específico de login que altere conteúdo. (4) Middleware: inexistente; sem rewrites. (5) Nenhuma duplicidade, fallback, wrapper ou composição paralela encontrada.
- **Rota canônica:** `app/(app)/login/page.tsx` — única rota para /login; contém comentário de canonical no topo do arquivo.
- **Componente canônico:** `components/LoginPageClient.tsx` — única implementação da UI de /login (header, botão Google, DataDisclosure, PrivacyReassurance, links); seção principal com `data-login-canonical="full"` para verificação no DOM em produção.
- **Caminhos removidos/neutralizados:** Nenhum caminho alternativo existia no repositório; nenhum arquivo foi removido. Consolidação feita por (1) documentação explícita da rota e do componente canônicos, (2) comentários no código proibindo duplicar rota ou usar outra UI para /login, (3) sentinela no DOM: `data-login-canonical="full"` na section principal do LoginPageClient para verificação em produção.
- **Por que a divergência não pode mais acontecer (por código):** Há uma única árvore: /login → (app)/login/page.tsx → LoginPageClient. Não há condicional por ambiente que altere a UI. Qualquer build a partir deste repositório gera a mesma composição. Se produção ainda exibir versão simplificada, a causa é deploy/build (branch ou commit errado); verificar no Vercel o commit publicado e redeployar a branch correta. Em produção, inspecionar o DOM em /login: deve existir `data-login-canonical="full"` na section principal; ausência indica build antigo ou cache.
- **Comportamento preservado:** Fluxo de auth, Supabase, callback e link "Diagnóstico" oculto em produção inalterados.

---

## Checklist operacional: validar se produção está com a versão canônica de /login

- **Objetivo:** Provar, com verificação objetiva, se a versão canônica de /login está publicada. E2E em `e2e/smoke.spec.ts` (describe "Rota /login (versão canônica)") valida sentinela, heading, CTA, blocos de confiança e ausência do link Diagnóstico em build de produção.
- **Regra decisiva:** Se `[data-login-canonical="full"]` estiver **ausente** em produção na página /login, o problema é **build/cache/deploy** (branch ou commit errado, cache de CDN/build), **não código**. Não reabrir hipótese de duplicidade de rota.
- **Validação no browser (produção ou build local):**
  1. Abrir a URL de produção (ou `http://127.0.0.1:3000/login` após `npm run build && npm run start`).
  2. Abrir DevTools (F12) → aba Elements/Inspecionar.
  3. Procurar no DOM por um elemento com atributo `data-login-canonical="full"`. Deve existir na `<section>` principal do formulário de login. **Se não existir:** build/cache/deploy incorreto; redeployar a branch correta e/ou invalidar cache.
  4. Confirmar presença do título "Sincronize seus aniversários", do botão "Continuar com Google", dos blocos "O que será compartilhado" e "O que NÃO acessamos", e dos links Privacidade e Termos.
  5. Em produção: confirmar que o link "Diagnóstico" **não** aparece (em dev pode aparecer).
- **Validação automatizada:** Rodar `npx playwright test e2e/smoke.spec.ts --grep "Rota /login"`. O smoke por padrão sobe o app com `npm run build && npm run start` (build de produção); o teste falha se a sentinela ou os elementos-chave estiverem ausentes ou se o link Diagnóstico estiver presente.
- **Data-attributes para testabilidade (LoginPageClient):** `data-login-canonical="full"` (section), `data-login-heading="main"` (h1), `data-login-cta="google"` (botão), `data-login-cta-wrapper` (wrapper do CTA), `data-login-disclosure="shared"` (bloco O que será compartilhado), `data-login-privacy="reassurance"` (bloco O que NÃO acessamos). Nenhum altera o visual; servem apenas para seletores estáveis em E2E e inspeção manual.

---

## Diagnóstico final /login em produção — problema operacional

- **Diagnóstico:** A produção atual **não** está servindo a versão canônica da rota /login: validação no browser (DOM) confirmou ausência das sentinelas (`data-login-canonical="full"`, `data-login-disclosure="shared"`, `data-login-privacy="reassurance"`). O problema é **operacional** (publicação/build/cache/ambiente), **não** de implementação da rota nem de UX; não reabrir frentes de código para /login.
- **Próximo passo:** Executar o checklist operacional abaixo para corrigir a publicação no Vercel/ambiente.

---

## Checklist operacional de correção — publicar versão canônica de /login

Ordem sugerida para corrigir a publicação:

1. **Validar build local em modo produção**  
   Rodar `npm run build && npm run start`, abrir `/login`, no console do browser executar `document.querySelector('[data-login-canonical="full"]')` — deve retornar um elemento, não `null`. Confirmar que o build do repositório atual gera a versão canônica.

2. **Confirmar branch e commit em produção**  
   No painel do Vercel (Project → Deployments): anotar a **branch** e o **commit SHA** do deploy ativo de produção. Comparar com a branch/commit esperada (ex.: `main` ou a branch que contém a versão canônica de `LoginPageClient`). Se forem diferentes, a causa é deploy da branch/commit errada.

3. **Forçar redeploy da versão correta**  
   No Vercel: fazer redeploy a partir da branch/commit que contém a versão canônica (ex.: "Redeploy" no último deploy da branch correta, ou push novo para a branch de produção). Aguardar o build concluir.

4. **Verificar cache/CDN**  
   Após o redeploy: abrir /login em aba anônima ou com cache desativado; repetir a checagem no DOM. Se as sentinelas continuarem ausentes, considerar invalidação de cache (Vercel: Settings → General → "Cache" ou redeploy com "Clear cache and redeploy" se disponível).

5. **Confirmar projeto e domínio no Vercel**  
   Garantir que a URL de produção usada (ex.: bday-hub.vercel.app ou uselembra.com.br) está ligada ao **projeto** e ao **deploy** corretos. Se houver alias ou domínio custom apontando para outro projeto/deploy, corrigir o alias ou o domínio.

6. **Confirmar build de produção**  
   No Vercel, no deploy que deveria ser o correto: verificar que o build usou o repositório/branch/commit esperados e que não há variável de ambiente ou configuração (ex.: `VERCEL_GIT_COMMIT_REF`, branch de preview) fazendo uso de outro commit. Em caso de dúvida, disparar um novo deploy explícito da branch correta.

7. **Validação pós-correção**  
   Abrir /login em produção e no console executar:  
   `document.querySelector('[data-login-canonical="full"]') !== null`  
   Deve retornar `true`. Opcional: rodar `npx playwright test e2e/smoke.spec.ts --grep "Rota /login"` contra a URL de produção (configurando `baseURL` no Playwright para a URL de prod) para validar de forma automatizada.
