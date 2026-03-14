

# Guia do Usuário - Página de Ajuda no App

## Objetivo
Criar uma página `/ajuda` dentro do app com um guia completo de como configurar e usar o Valkyra, acessível via Configurações.

## Estrutura da Página

Uma página com seções em accordion cobrindo todo o fluxo do app:

### Seções do Guia

1. **Primeiros Passos** - Criar conta, confirmar email, fazer login
2. **Completar Cadastro** - 4 etapas: dados pessoais (CPF), endereço (CEP), foto de perfil, contato de emergência
3. **Botão SOS** - Como acionar, o que acontece (alerta + localização), como cancelar, ativação silenciosa
4. **Mapa de Risco** - Filtros (agressão, assédio, suspeito, stalking), como reportar incidentes
5. **Monitoramento de Trajeto** - Informar destino, compartilhar localização em tempo real
6. **Meu Painel** - Visualizar perfil, histórico de alertas
7. **Configurações** - Gerenciar contatos de emergência (até 5), ligar para emergências (180, 190, 192, 193, 153, 181)
8. **Planos e Assinatura** - Como escolher um plano

## Alterações

| Arquivo | Mudança |
|---|---|
| `src/pages/AjudaPage.tsx` | Nova página com accordions para cada seção do guia |
| `src/App.tsx` | Adicionar rota `/ajuda` (protegida) |
| `src/pages/ConfigPage.tsx` | Adicionar botão "Como usar o app" que navega para `/ajuda` |

## Detalhes Técnicos

- Usar componente `Accordion` já existente no projeto (`@radix-ui/react-accordion`)
- Ícones do `lucide-react` para cada seção
- Estilo consistente com o resto do app (Tailwind, `font-display`, `rounded-xl`)
- Botão de voltar no topo da página

