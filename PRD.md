# BdayHub â€” PRD (MVP)

## Status do projeto (atualizado em 2026-02-24)

### Resumo executivo
- MVP entregue end-to-end e validado manualmente.
- Stack mantida conforme SPEC (Next.js App Router + TypeScript + Tailwind + IndexedDB/idb + fallback localStorage + next-pwa).
- Sem backend (conforme escopo).
- Deploy em producao ativo: https://bday-hub.vercel.app
- Repositorio: https://github.com/r-yudi/bday-hub

### Entregas concluidas (MVP)
- Tela Hoje (/today) com lista e acoes rapidas.
- Tela Proximos 7 dias (/upcoming).
- CRUD completo (adicionar, editar, excluir) via /person.
- Importacao CSV com preview de linhas validas/invalidas e importacao.
- Templates de mensagem + acao de copiar.
- Acoes de abrir links (WhatsApp/Instagram/outro).
- Persistencia local com IndexedDB e fallback localStorage.
- Notificacao best-effort ao abrir o app (com fallback visual quando sem permissao/suporte).
- Opcao de limpar todos os dados locais.

### Entregas v1 ja implementadas (antecipadas)
- /share/[token] (link privado client-only) conforme secao 5.2 / secao 8 da SPEC.
- Botao de copiar link em PersonCard.
- Pagina de compartilhamento com CTA Adicionar a minha lista criando item com source=shared.

### Validacao realizada
- Testes unitarios minimos implementados e passando:
  - calculo de proximos 7 dias
  - validacao/parsing de CSV
  - encode/decode de share token (extra)
- Smoke E2E automatizado (Playwright) implementado e validado:
  - CRUD de aniversario
  - import CSV
  - persistencia apos reload
  - fluxo /share/[token] -> adicionar a lista
- Smoke test manual validado em producao:
  - adicionar manual
  - importar CSV valido e invalido
  - fluxo /share/[token]
  - estados de notificacao (granted / denied)

### Versionamento / releases
- v0.1.0 (MVP inicial) publicado no GitHub Releases.
- v0.1.1 (patch) publicado com:
  - .gitattributes para line endings
  - melhoria de UX na secao de notificacoes
- v0.1.2 (patch) publicado com:
  - Playwright E2E smoke tests (4 fluxos criticos do MVP)
  - script npm run test:e2e
  - documentacao no README
  - atualizacao de PRD/SPEC + AGENTS.md para continuidade do projeto

### Proximos passos para o escopo total
- Evoluir compartilhamento para revogacao (exige backend minimo ou estrategia remota).
- Avaliar dedupe/merge no import CSV (hoje: warning + duplicacao permitida).
- Definir estrategia de notificacao mais confiavel (alem do best-effort ao abrir).
- Priorizar itens v2 fora de escopo atual somente apos novo recorte de produto.
## 1) Problema
Hoje os aniversÃ¡rios estÃ£o espalhados (contatos, redes sociais, anotaÃ§Ãµes). O Facebook resolvia bem a dor de â€œquem faz aniversÃ¡rio hojeâ€, mas essa experiÃªncia se perdeu. O usuÃ¡rio quer um lugar simples para:
- ver aniversariantes do dia
- ser lembrado automaticamente
- ter aÃ§Ãµes rÃ¡pidas (mensagem/cÃ³pia/link)

## 2) Objetivo do MVP
Entregar um app web de custo mÃ­nimo que funcione end-to-end:
- Tela "Hoje" + "PrÃ³ximos 7 dias"
- Cadastro manual e importaÃ§Ã£o por CSV
- NotificaÃ§Ã£o diÃ¡ria (1 canal)
- AÃ§Ã£o â€œcopiar mensagemâ€ e â€œabrir linkâ€

## 3) PÃºblico-alvo
Pessoas que mantÃªm relaÃ§Ãµes em mÃºltiplas plataformas (trabalho/amigos/famÃ­lia) e sentem falta do lembrete automÃ¡tico de aniversÃ¡rios.

## 4) Principais casos de uso
1. UsuÃ¡rio adiciona aniversÃ¡rios (manual ou CSV).
2. UsuÃ¡rio abre o app e vÃª quem faz aniversÃ¡rio hoje.
3. UsuÃ¡rio recebe um lembrete diÃ¡rio com os aniversariantes do dia.
4. UsuÃ¡rio copia uma mensagem pronta ou abre um link (WhatsApp/Instagram) para parabenizar.

## 5) Escopo do MVP (inclui)
### 5.1 Funcionalidades
- Lista â€œHojeâ€
- Lista â€œPrÃ³ximos 7 diasâ€ (ordenada por data)
- CRUD bÃ¡sico:
  - adicionar pessoa (nome, dia/mÃªs, tags, origem, observaÃ§Ã£o, links opcionais)
  - editar/excluir
- Import CSV (modelo simples fornecido)
- NotificaÃ§Ã£o diÃ¡ria (escolher 1):
  - NotificaÃ§Ã£o do navegador (permission-based) OU
  - Email (se tiver backend) â€” preferir o mais simples na implementaÃ§Ã£o
- Templates de mensagem (2â€“3 opÃ§Ãµes) e botÃ£o â€œCopiarâ€
- Busca simples por nome (opcional se for rÃ¡pido)

### 5.2 v1 (logo depois do MVP, mas jÃ¡ prevista no design)
- Link privado para â€œCompartilhar meu aniversÃ¡rioâ€:
  - usuÃ¡rio gera um link que exibe apenas: nome + dia/mÃªs (sem ano)
  - opÃ§Ã£o de copiar link
  - pÃ¡gina do link tem CTA: â€œAdicionar este aniversÃ¡rio na minha listaâ€
  - Sem diretÃ³rio pÃºblico, sem descoberta.

## 6) Fora de escopo (MVP)
- IntegraÃ§Ãµes diretas com redes sociais via API
- ExtensÃ£o de navegador no MVP (pode virar v2)
- â€œRede socialâ€ interna: amigos, follow, feed
- Matching automÃ¡tico por contatos/telefone
- Idade/ano de nascimento
- NotificaÃ§Ãµes multi-canal e configuraÃ§Ãµes avanÃ§adas
- InternacionalizaÃ§Ã£o

## 7) Requisitos nÃ£o-funcionais
- Custo mÃ­nimo: preferir stack simples e deploy barato
- Privacidade:
  - Por padrÃ£o, dados privados do usuÃ¡rio
  - NÃ£o exibir ano de nascimento
  - Link de compartilhamento deve ser opcional e revogÃ¡vel
- Performance:
  - Carregamento rÃ¡pido, app leve
- Confiabilidade:
  - Import robusto (validar datas)

## 8) MÃ©tricas de sucesso
- AtivaÃ§Ã£o: usuÃ¡rio adiciona >= 5 aniversÃ¡rios em 5 minutos
- RetenÃ§Ã£o (7 dias): usuÃ¡rio volta e/ou recebe notificaÃ§Ã£o sem desativar
- AÃ§Ã£o: clique em â€œcopiar mensagemâ€ em pelo menos um aniversÃ¡rio

## 9) CritÃ©rios de aceite (Definition of Done)
- UsuÃ¡rio consegue:
  1) adicionar aniversÃ¡rios manualmente
  2) importar CSV
  3) ver â€œHojeâ€ e â€œPrÃ³ximos 7 diasâ€
  4) receber lembrete diÃ¡rio (1 canal)
  5) copiar mensagem com 1 clique
- Deploy local funciona com README passo-a-passo
- Dados persistem entre recarregamentos

