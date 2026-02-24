# Lembra - PRD v2 (Multi-device + Import + Email)

## Objetivo
O app definitivo para nunca esquecer aniversarios.

Evoluir o MVP client-only para uma versao utilizavel no dia a dia de quem quer manter aniversarios organizados:
- Login com Google
- Sincronizacao multi-device (desktop + mobile)
- Importacao automatica de aniversarios via Google Contacts (People API)
- Notificacao confiavel por e-mail (diaria e/ou semanal)

## Por que
A dor de esquecer aniversarios e recorrente e silenciosa. Para virar habito, o produto precisa ser:
- automatico (import)
- confiavel (notificacao)
- acessivel (mobile + sync)

## Escopo v2 (inclui)
### 1) Auth + conta
- Login com Google
- Sessao persistente
- "Logout"

### 2) Sync multi-device
- Fonte da verdade: DB (Supabase/Postgres)
- App continua rapido e simples
- Sem "colaboracao" e sem funcionalidades sociais (foco em aniversarios)

### 3) Import Google Contacts
- Botao "Importar do Google"
- Preview do que sera importado
- Dedupe basico (nao importar duplicados por padrao)
- Nao importar ano (se existir no contato, ignorar)

### 4) Notificacoes por e-mail
- Canal padrao: e-mail
- Frequencia:
  - Diario: "Aniversariantes de hoje"
  - Semanal: "Proximos 7 dias" (opcional)
- Configuracao simples: ligar/desligar + horario preferido

## Fora de escopo v2
- Push notification "real" em background no mobile
- Extensao de navegador
- Integracao com Facebook/Instagram para aniversarios
- Grafo social / amigos
- Matching automatico por telefone/contatos (alem do import do Google)

## Metricas de sucesso v2
- Ativacao: usuario importa ou adiciona 5 aniversarios em < 3 min
- Retencao 7 dias: usuario recebe e-mail e realiza ao menos 1 acao (copiar mensagem/abrir link)
- "Time-to-value": primeiro e-mail util de aniversarios entregue em ate 24h apos setup

## Criterios de aceite v2
- Login Google funciona em desktop e mobile
- CRUD sincronizado (aparece igual em dispositivos diferentes)
- Import do Google traz aniversarios existentes (quando houver)
- E-mail diario chega com conteudo correto
- Usuario pode desativar e-mail a qualquer momento
