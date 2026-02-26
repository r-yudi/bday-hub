# PIPELINE — Processo obrigatório (Lembra Series A)

## Objetivo
Executar entregas em sequência controlada, por etapas, com critérios objetivos de "Pronto quando" e registro de decisões.

## Fase 0 — Conversação Estratégica

- **Conversas soltas** são tratadas como **Intenção**. O agente opera em Co-Founder Mode (ver [docs/DEFAULT_MODE.md](docs/DEFAULT_MODE.md)).
- **Nenhuma mudança estrutural** pode nascer diretamente de conversa. Antes de execução, deve haver:
  - **resumo da intenção**
  - **proposta de plano** (escopo, arquivos tocados, riscos)
  - **confirmação explícita** do usuário
- Só após confirmação o trabalho passa ao ciclo Scaffold → Wire → Polish → Harden da etapa correspondente.

## Regras
- Não misturar etapas: só avançar quando a anterior estiver concluída.
- Cada etapa segue o ciclo: **Scaffold → Wire → Polish → Harden**.
- Ao final de cada etapa: **pós-mortem** e registro em `docs/DECISIONS.md` quando houver decisão estrutural.
- Decisões estruturais e de escopo devem ser registradas em `docs/DECISIONS.md`.
- Em conflito entre PRD e MANIFESTO, **MANIFESTO vence**.

## Ciclo por etapa
1. **Scaffold:** Estrutura mínima; garantir que apenas os arquivos previstos sejam alvo; criar stubs de docs se necessário.
2. **Wire:** Conectar fluxo real (UI, dados, integração); implementar comportamento principal.
3. **Polish:** Refinar UX, copy, estados, acessibilidade e design system.
4. **Harden:** Build, testes, revisão de regressões, pós-mortem e atualização de docs.

## Etapas do plano atual
- **Etapa 1:** Ruptura visual hero/landing (apenas UI; zero lógica/repos/rotas internas).
- **Etapa 2:** Web Push simples MVP (permissão, horário, deep link, dedupe; guest/logado).
- **Etapa 3:** Consolidação UI V2 em /today e /manage (hierarquia, CTA dominante, empty states celebratórios).
