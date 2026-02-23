# BdayHub — PRD (MVP)

## 1) Problema
Hoje os aniversários estão espalhados (contatos, redes sociais, anotações). O Facebook resolvia bem a dor de “quem faz aniversário hoje”, mas essa experiência se perdeu. O usuário quer um lugar simples para:
- ver aniversariantes do dia
- ser lembrado automaticamente
- ter ações rápidas (mensagem/cópia/link)

## 2) Objetivo do MVP
Entregar um app web de custo mínimo que funcione end-to-end:
- Tela "Hoje" + "Próximos 7 dias"
- Cadastro manual e importação por CSV
- Notificação diária (1 canal)
- Ação “copiar mensagem” e “abrir link”

## 3) Público-alvo
Pessoas que mantêm relações em múltiplas plataformas (trabalho/amigos/família) e sentem falta do lembrete automático de aniversários.

## 4) Principais casos de uso
1. Usuário adiciona aniversários (manual ou CSV).
2. Usuário abre o app e vê quem faz aniversário hoje.
3. Usuário recebe um lembrete diário com os aniversariantes do dia.
4. Usuário copia uma mensagem pronta ou abre um link (WhatsApp/Instagram) para parabenizar.

## 5) Escopo do MVP (inclui)
### 5.1 Funcionalidades
- Lista “Hoje”
- Lista “Próximos 7 dias” (ordenada por data)
- CRUD básico:
  - adicionar pessoa (nome, dia/mês, tags, origem, observação, links opcionais)
  - editar/excluir
- Import CSV (modelo simples fornecido)
- Notificação diária (escolher 1):
  - Notificação do navegador (permission-based) OU
  - Email (se tiver backend) — preferir o mais simples na implementação
- Templates de mensagem (2–3 opções) e botão “Copiar”
- Busca simples por nome (opcional se for rápido)

### 5.2 v1 (logo depois do MVP, mas já prevista no design)
- Link privado para “Compartilhar meu aniversário”:
  - usuário gera um link que exibe apenas: nome + dia/mês (sem ano)
  - opção de copiar link
  - página do link tem CTA: “Adicionar este aniversário na minha lista”
  - Sem diretório público, sem descoberta.

## 6) Fora de escopo (MVP)
- Integrações diretas com redes sociais via API
- Extensão de navegador no MVP (pode virar v2)
- “Rede social” interna: amigos, follow, feed
- Matching automático por contatos/telefone
- Idade/ano de nascimento
- Notificações multi-canal e configurações avançadas
- Internacionalização

## 7) Requisitos não-funcionais
- Custo mínimo: preferir stack simples e deploy barato
- Privacidade:
  - Por padrão, dados privados do usuário
  - Não exibir ano de nascimento
  - Link de compartilhamento deve ser opcional e revogável
- Performance:
  - Carregamento rápido, app leve
- Confiabilidade:
  - Import robusto (validar datas)

## 8) Métricas de sucesso
- Ativação: usuário adiciona >= 5 aniversários em 5 minutos
- Retenção (7 dias): usuário volta e/ou recebe notificação sem desativar
- Ação: clique em “copiar mensagem” em pelo menos um aniversário

## 9) Critérios de aceite (Definition of Done)
- Usuário consegue:
  1) adicionar aniversários manualmente
  2) importar CSV
  3) ver “Hoje” e “Próximos 7 dias”
  4) receber lembrete diário (1 canal)
  5) copiar mensagem com 1 clique
- Deploy local funciona com README passo-a-passo
- Dados persistem entre recarregamentos