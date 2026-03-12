

## Problema identificado

Quando um visitante (não logado) clica em "Mapa", "Trajeto" ou "Config" no menu inferior, o `ProtectedRoute` redireciona para `/login`. Nessa tela, o menu inferior some (está na lista `hiddenRoutes`), e o usuário fica "preso" sem ver o botão SOS.

O comportamento esperado: visitantes devem ver sempre o botão SOS e o menu inferior. Ao clicar nas abas protegidas, devem ser levados para `/cadastro` (não `/login`), e conseguir voltar facilmente.

## Plano

### 1. Alterar `ProtectedRoute` em `App.tsx`
- Redirecionar usuários não logados para `/cadastro` em vez de `/login`

### 2. Alterar `BottomNav.tsx`
- Não interceptar navegação para rotas protegidas — em vez disso, redirecionar para `/cadastro` diretamente no clique do menu, sem sair da navegação principal
- Usar `useAuth` para verificar se o usuário está logado antes de navegar para rotas protegidas
- Se não logado, navegar para `/cadastro`; se logado mas sem cadastro completo, navegar para `/completar-cadastro`
- Manter o menu sempre visível exceto em `/onboarding`, `/admin`, `/completar-cadastro`

### 3. Manter `/login` acessível
- Remover `/login` e `/cadastro` da lista `hiddenRoutes` do BottomNav para que o menu apareça nessas telas também, **ou** manter oculto mas garantir que o fluxo principal nunca leve o usuário para lá involuntariamente

### Arquivos modificados
- `src/App.tsx` — ProtectedRoute redireciona para `/cadastro`
- `src/components/BottomNav.tsx` — lógica de auth no clique + ajuste de `hiddenRoutes`

