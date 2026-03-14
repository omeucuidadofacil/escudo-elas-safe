

# Sistema de Acesso por Assinatura para Recursos Não-Emergenciais

## Objetivo
Bloquear acesso ao **Mapa de Risco** e **Monitoramento de Trajeto** para usuárias sem assinatura ativa, mantendo o **SOS sempre disponível** para todas.

## Como funciona

- Ao acessar `/mapa` ou `/trajeto`, o app verifica se a usuária tem assinatura ativa via a edge function `check-subscription` já existente
- Se não tiver: exibe o `PaymentPopup` impedindo o uso do recurso
- Se tiver: acesso liberado normalmente
- SOS (`/sos`) permanece 100% livre, sem verificação de assinatura

## Alterações

| Arquivo | Mudança |
|---|---|
| `src/hooks/useAuth.tsx` | Adicionar estado `subscribed` (boolean) ao contexto, chamando `check-subscription` após login e periodicamente |
| `src/pages/MapaPage.tsx` | Verificar `subscribed` do contexto; se `false`, exibir overlay com `PaymentPopup` |
| `src/pages/TrajetoPage.tsx` | Mesma lógica: verificar `subscribed`; se `false`, exibir `PaymentPopup` |
| `src/components/PaymentPopup.tsx` | Permitir fechar o popup com navegação de volta (adicionar `onClose` que redireciona para `/`) |

## Fluxo do Usuário

```text
Usuária abre /mapa ou /trajeto
  ├─ Tem assinatura ativa? → Acesso normal
  └─ Não tem assinatura?  → Tela bloqueada + PaymentPopup
                              ├─ "Assinar agora" → Stripe checkout
                              └─ "Voltar" → Redireciona para /
```

## Detalhes Técnicos

1. **useAuth.tsx**: Adicionar `subscribed: boolean` e `checkSubscription()` que invoca `supabase.functions.invoke("check-subscription")`. Chamar no `onAuthStateChange` e com `setInterval` a cada 60s.

2. **MapaPage / TrajetoPage**: Wrapper condicional:
   - Se `subscribed === false` e não está carregando: renderizar fundo desfocado + `PaymentPopup` centralizado
   - Se `subscribed === true`: renderizar página normalmente

3. **BottomNav**: Sem alterações — os links continuam visíveis para que a usuária descubra os recursos premium e seja incentivada a assinar.

