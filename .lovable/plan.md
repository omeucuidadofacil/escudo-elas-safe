

## Diagnóstico do erro de pagamento

O erro nos logs é claro:

> "The provided key 'rk_live_...' does not have the required permissions for this endpoint. Having the 'rak_checkout_session_write' permission would allow this request to continue."

### Problema
A chave Stripe configurada é uma **restricted key** (`rk_live_...`) que não tem permissão para criar sessões de checkout. Ela precisa da permissão `rak_checkout_session_write`.

### Solução

Você tem duas opções:

**Opção A (recomendada):** Substituir a restricted key por uma **secret key padrão** (`sk_live_...`) no painel Stripe → Developers → API Keys. A secret key tem todas as permissões.

**Opção B:** Editar a restricted key no painel Stripe e adicionar a permissão **Checkout Sessions: Write**.

Após obter a chave correta, atualizarei o secret `STRIPE_SECRET_KEY` no backend com o novo valor.

### Etapa técnica
- Atualizar o secret `STRIPE_SECRET_KEY` usando a ferramenta de secrets com a nova chave fornecida pelo usuário.

