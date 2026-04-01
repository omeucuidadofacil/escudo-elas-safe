

## Plano: Completar cadastro de APIs e adicionar planos com valores definidos

### Resumo

Duas mudanças principais:
1. **APIs** — Expandir o formulário de cadastro de API keys com campos adicionais (URL base, tipo de chave, ambiente test/live, descrição) e adicionar mais provedores de pagamento ao catálogo
2. **Planos** — Inserir no banco os 3 planos pré-definidos: Gratuito (R$0), Mensal (R$7,99) e Anual (R$71,88)

### Mudanças

**1. Expandir `ApiKeysTab.tsx` — Formulário completo de API**

- Adicionar campos ao formulário: `descricao` (descrição/observação), `ambiente` (test/produção), `url_base` (URL base da API, opcional)
- Expandir a lista `SERVICOS` com mais provedores: Rede, Getnet, Vindi, Pagar.me, SafraPay, PicPay, Banco Inter, Gerencianet/Efí
- Exibir o ambiente (test/produção) como badge nos cards listados
- Os novos campos são opcionais — não requer mudança no banco, pois podem ser armazenados no campo `chave` como JSON ou adicionados à tabela

**2. Migração de banco — Adicionar colunas à tabela `api_keys`**

```sql
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS descricao text DEFAULT '';
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS ambiente text DEFAULT 'producao';
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS url_base text DEFAULT '';
```

**3. Inserir planos no banco de dados**

Criar migração para inserir os 3 planos (sem Stripe IDs por enquanto — admin pode vincular depois):

```sql
INSERT INTO planos (nome, descricao, preco, intervalo, ativo) VALUES
  ('Gratuito', 'Acesso básico ao app com funcionalidades essenciais', 0, 'month', true),
  ('Mensal', 'Proteção completa com todos os recursos premium', 7.99, 'month', true),
  ('Anual', 'Proteção completa com desconto - economia de 25%', 71.88, 'year', true)
ON CONFLICT DO NOTHING;
```

**4. Atualizar `ApiKeysTab.tsx`**

- Formulário com os novos campos (descrição, ambiente, URL base)
- Lista SERVICOS expandida com ~20+ provedores
- Cards exibindo ambiente e descrição

### Arquivos modificados

- `src/components/admin/ApiKeysTab.tsx` — formulário completo + mais provedores
- Nova migração SQL — colunas em `api_keys` + inserção dos 3 planos

