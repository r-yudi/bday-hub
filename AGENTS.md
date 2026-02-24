# AGENTS.md

## Projeto
- Nome: BdayHub
- Objetivo atual: evoluir a partir de um MVP client-only ja entregue e publicado.
- Deploy de producao: https://bday-hub.vercel.app
- Repositorio: https://github.com/r-yudi/bday-hub

## Estado atual (baseline)
- MVP concluido e validado (manual + testes unitarios + smoke E2E Playwright).
- Releases publicadas:
  - v0.1.0 (MVP)
  - v0.1.1 (patch de UX/manutencao)
  - v0.1.2 (patch de QA/documentacao com Playwright E2E)
- Stack definida e mantida conforme SPEC.md.

## Regras para agentes (obrigatorias)
- Ler PRD.md e SPEC.md antes de propor mudancas de escopo.
- Nao alterar a stack sem aprovacao explicita.
- Preservar o escopo do MVP ja entregue; novas features devem ser tratadas como vNext.
- Sem backend, a menos que a tarefa explicitamente abra nova fase de escopo.
- Se arquivo ja existir, adaptar em vez de recriar.
- Documentar limitacoes quando uma funcionalidade nao puder ser confiavel em ambiente browser (ex.: notificacoes agendadas).

## Stack atual (nao trocar sem alinhamento)
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Persistencia local: IndexedDB (idb) com fallback localStorage
- PWA: next-pwa
- Deploy: Vercel

## Funcionalidades ja entregues
- /today e /upcoming
- CRUD de aniversarios (/person)
- Importacao CSV com preview de validas/invalidas
- Templates de mensagem + copiar
- Links rapidos (WhatsApp/Instagram/outro)
- Notificacao best-effort ao abrir o app
- /share/[token] v1 client-only
- Limpar dados locais

## Testes e validacao
- Rodar antes de finalizar mudancas relevantes:
  - npm test
  - npm run test:e2e
  - npm run build (quando alterar comportamento/rotas/config)
- Smoke test manual minimo quando mexer em fluxos:
  - adicionar/editar/excluir
  - importar CSV valido/invalido
  - /share/[token]
  - /today notificacoes (granted/denied)
- Smoke E2E automatizado (Playwright) ja cobre:
  - CRUD
  - import CSV
  - persistencia apos reload
  - /share/[token] -> adicionar a lista

## Convencoes praticas
- Commits pequenos e objetivos.
- Se houver patch sem mudanca de escopo, usar release patch (v0.1.x).
- Registrar andamento/decisoes em PRD.md e SPEC.md sem sobrescrever criterios historicos do MVP.

## Proximos focos sugeridos (vNext)
- Estrategia de backend minimo para revogacao de link compartilhado.
- Dedupe/merge de importacao CSV.
- Notificacoes mais confiaveis alem do fallback ao abrir.
- Expandir E2E (ex.: cenarios de notificacao/permissao e regressao visual leve).
