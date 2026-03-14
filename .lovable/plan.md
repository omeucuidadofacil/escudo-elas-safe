

# Implementação: Alertas SOS via E-mail e Telegram

## Situação Atual

- O domínio `valkyra.com.br` ainda **não está configurado** no workspace — precisa ser adicionado primeiro
- O token do Telegram foi fornecido: `8674247714:AAEvJkZSX5yeEpBJzatWTrET2oI6MU1sqbo`
- A tabela `contatos_emergencia` tem apenas: `nome`, `telefone`, `relacao` — faltam campos para e-mail e Telegram

## Etapas

### 1. Configurar domínio de e-mail
Abrir o diálogo de configuração de domínio para `valkyra.com.br`. Isso é necessário para enviar e-mails a partir de `sos@valkyra.com.br`.

### 2. Conectar Telegram
Usar o conector Telegram para vincular o bot ao projeto, disponibilizando as credenciais como variáveis de ambiente nas edge functions.

### 3. Migração de banco de dados
Adicionar colunas à tabela `contatos_emergencia`:
- `email` (text, nullable) — e-mail do contato para receber alertas
- `telegram_chat_id` (text, nullable) — chat ID do Telegram do contato

### 4. Criar edge function `send-sos-alert`
Quando o SOS é acionado, essa função:
- Busca os contatos de emergência da usuária
- Para cada contato com `email`: envia e-mail via infraestrutura de e-mail com localização e link de rastreamento
- Para cada contato com `telegram_chat_id`: envia mensagem via gateway do Telegram com localização e link de rastreamento
- Retorna o resultado (quantos notificados)

### 5. Atualizar formulário de contatos (ConfigPage)
Adicionar campos opcionais no formulário de adicionar contato:
- Campo de e-mail
- Campo de chat ID do Telegram (com instrução para o contato enviar `/start` ao bot)

### 6. Atualizar SOSPage
Após ativar o alerta e inserir na tabela `alertas`, chamar `send-sos-alert` passando o ID do alerta e coordenadas.

## Fluxo do Alerta

```text
Usuária pressiona SOS (3s)
  → Insere alerta no banco
  → Chama send-sos-alert
      ├─ Contato tem e-mail? → Envia e-mail com localização
      └─ Contato tem telegram_chat_id? → Envia mensagem Telegram
  → Toast: "Contatos notificados"
```

## Pré-requisito do Usuário
Antes de implementar, precisamos:
1. Configurar o domínio de e-mail `valkyra.com.br` (abre um diálogo)
2. Conectar o bot do Telegram ao projeto (abre um diálogo)

Ambos serão feitos no início da implementação.

