

## Plano: Fluxo de Login/Cadastro como na imagem

### O que muda

A tela de login (screenshot anexo) já está visualmente pronta. O pedido é ajustar o **fluxo de navegação**:

1. **Usuários sem conta** → ao acessar a app, são redirecionados para `/cadastro` (criar conta)
2. **Admin master** → acessa `/login` diretamente, digita email e senha, vai para `/admin`
3. **Painel individual** → cada usuário tem seu próprio painel; admin tem o dele separado

### Mudanças necessárias

**1. Ajustar rotas em `src/App.tsx`**
- A rota `/` (Index/home) deve ser acessível sem login (já é)
- Quando um usuário não logado tenta acessar rotas protegidas, redirecionar para `/cadastro` (já funciona assim)
- Manter `/login` como rota pública separada para o admin acessar manualmente

**2. Ajustar `src/pages/LoginPage.tsx`**
- Remover o link "Não tem conta? Criar conta" ou mantê-lo discreto — o login é primariamente para o admin
- Manter o visual atual (já bate com a imagem)

**3. Ajustar `src/pages/CadastroPage.tsx`**
- Manter o link "Já tem conta? Entrar" para quem já tem conta poder ir ao login
- Esse é o ponto de entrada padrão para novas usuárias

**4. Ajustar `ProtectedRoute` em `src/App.tsx`**
- Usuários não logados em rotas protegidas → redirecionar para `/cadastro` (já está assim na linha 34)

### Resumo
O fluxo já está quase correto. As mudanças são mínimas — basicamente garantir que o redirect padrão de usuários não logados vai para `/cadastro`, e o `/login` fica como acesso direto (principalmente para admin). Nenhuma mudança de banco de dados necessária.

