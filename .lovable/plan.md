

# Próximo Passo: Conectar o Telegram

O bot `@valkyra_sos_bot` já foi criado com sucesso (confirmado pelo screenshot). Agora preciso vincular o conector Telegram ao projeto para que o token fique disponível como variável de ambiente nas edge functions.

## Ação necessária

Vou abrir o diálogo de conexão do Telegram. Você precisará:
1. Colar o token do bot: `8674247714:AAEvJkZSX5yeEpBJzatWTrET2oI6MU1sqbo`
2. Confirmar a conexão

Após isso, implementarei:
1. **Migração DB** — adicionar colunas `email` e `telegram_chat_id` na tabela `contatos_emergencia`
2. **Edge function `send-sos-alert`** — enviar alertas via Telegram (e e-mail quando o domínio estiver pronto)
3. **UI** — campos de e-mail e Telegram no formulário de contatos + chamada ao SOS

