

## Plano: Gerenciar chave Stripe e preços via Painel Admin

### Resumo
Tornar o sistema totalmente dinâmico: o PaymentPopup busca os planos do banco de dados (tabela `planos`), e as edge functions leem a chave Stripe da tabela `api_keys` — tudo gerenciável pelo painel admin.

### Mudanças

**1. PaymentPopup dinâmico** (`src/components/PaymentPopup.tsx`)
- Remover o objeto `PLANS` hardcoded
- Ao abrir, buscar planos ativos da tabela `planos` (que já tem `stripe_price_id`, `nome`, `preco`, `intervalo`)
- Renderizar os planos dinamicamente com os valores do banco
- Usar o `stripe_price_id` do banco ao chamar `create-checkout`

**2. Edge functions leem chave Stripe do banco** 
- Alterar `create-checkout`, `check-subscription` e `manage-plans` para:
  - Primeiro tentar `Deno.env.get("STRIPE_SECRET_KEY")`
  - Se não encontrar (ou como fallback), buscar na tabela `api_keys` onde `servico = 'stripe'` e `ativo = true`
- Isso permite que o admin configure a chave Stripe pelo painel (aba APIs) sem depender de secrets do ambiente

**3. Nenhuma mudança no painel admin**
- A aba "Planos" já cria planos com sincronização Stripe (cria produto + preço no Stripe e salva os IDs)
- A aba "APIs" já permite adicionar chave Stripe com `servico = 'stripe'`
- Apenas o fluxo de consumo precisa ser atualizado

### Detalhes técnicos
- As edge functions usarão `SUPABASE_SERVICE_ROLE_KEY` para ler `api_keys` (bypassa RLS)
- O PaymentPopup identifica mensal/anual pelo campo `intervalo` da tabela `planos`
- O plano anual mostrará preço por mês calculado (preco / 12) e o badge de economia

