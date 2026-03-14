import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, ClipboardList, ShieldAlert, Map, Navigation, LayoutDashboard, Settings, CreditCard, Send } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const sections = [
  {
    icon: UserPlus,
    title: "Primeiros Passos",
    content: `1. Abra o app e toque em "Criar conta".\n2. Informe seu e-mail e crie uma senha segura.\n3. Você receberá um e-mail de confirmação — clique no link para ativar sua conta.\n4. Após confirmar, volte ao app e faça login com seu e-mail e senha.`,
  },
  {
    icon: ClipboardList,
    title: "Completar Cadastro",
    content: `Após o primeiro login, você passará por 4 etapas obrigatórias:\n\n• Dados Pessoais — Informe seu nome completo e CPF.\n• Endereço — Digite seu CEP para preenchimento automático do endereço. Complete com número e complemento.\n• Foto de Perfil — Tire ou envie uma foto para identificação.\n• Contato de Emergência — Cadastre pelo menos 1 contato que será avisado em situações de risco.\n\nApós concluir, seu cadastro será enviado para aprovação.`,
  },
  {
    icon: ShieldAlert,
    title: "Botão SOS",
    content: `O botão SOS é o recurso principal do app.\n\n• Como acionar: Na tela inicial, pressione e segure o botão vermelho por 3 segundos.\n• O que acontece: Um alerta é enviado com sua localização em tempo real para seus contatos de emergência.\n• Como cancelar: Caso tenha acionado por engano, toque em "Cancelar Alerta" na tela de SOS ativo.\n• Ativação Silenciosa: Em Configurações, ative o modo silencioso para acionar o SOS sem chamar atenção (sem som ou vibração).`,
  },
  {
    icon: Send,
    title: "Alertas via Telegram",
    content: `Para que seus contatos de emergência recebam os alertas de SOS pelo Telegram, eles precisam seguir estes passos:\n\n1. Peça para seu contato abrir o Telegram e procurar o bot @valkyra_sos_bot.\n2. O contato deve enviar /start ou "começar" para o bot.\n3. O bot responderá com um número chamado Chat ID.\n4. Seu contato deve copiar esse número e enviar para você.\n5. No app, vá em Configurações → Contatos de Emergência → edite o contato e cole o Chat ID no campo "Telegram Chat ID".\n\n⚠️ Sem o Chat ID cadastrado, o contato não receberá alertas pelo Telegram.\n\n💡 Dica: Cada contato de emergência precisa fazer esse processo individualmente no próprio Telegram.`,
  },
  {
    icon: Map,
    title: "Mapa de Risco",
    content: `O mapa mostra incidentes reportados na sua região.\n\n• Filtros disponíveis: Agressão, Assédio, Suspeito e Stalking.\n• Toque nos marcadores para ver detalhes do incidente.\n• Para reportar: Toque no botão "Reportar" no mapa, escolha o tipo de incidente, descreva o que aconteceu e confirme a localização.\n• Quanto mais relatos, mais seguro fica o mapa para todas as usuárias.`,
  },
  {
    icon: Navigation,
    title: "Monitoramento de Trajeto",
    content: `Use quando estiver se deslocando e quiser que alguém acompanhe.\n\n• Informe o destino (endereço ou ponto de referência).\n• O app compartilha sua localização em tempo real com seus contatos de emergência.\n• Se você parar de se mover ou sair da rota, seus contatos serão notificados.\n• Ao chegar ao destino, o monitoramento é encerrado automaticamente.`,
  },
  {
    icon: LayoutDashboard,
    title: "Meu Painel",
    content: `No painel você encontra:\n\n• Seu perfil com foto, nome e informações cadastradas.\n• Histórico de alertas SOS enviados.\n• Status da sua conta (aprovada ou pendente).`,
  },
  {
    icon: Settings,
    title: "Configurações",
    content: `Gerencie suas preferências:\n\n• Contatos de Emergência — Adicione até 5 contatos que serão notificados em caso de SOS.\n• Ligar para Emergência — Acesse rapidamente os números:\n  – 180 (Delegacia da Mulher)\n  – 190 (Polícia Militar)\n  – 192 (SAMU)\n  – 193 (Bombeiros)\n  – 153 (Guarda Municipal)\n  – 181 (Disque Denúncia)\n• Notificações, Privacidade e Ativação Silenciosa.`,
  },
  {
    icon: CreditCard,
    title: "Planos e Assinatura",
    content: `O app oferece planos com recursos adicionais.\n\n• Na tela inicial, toque em "Assinar Plano" para ver as opções disponíveis.\n• Escolha o plano que melhor atende suas necessidades.\n• O pagamento é processado de forma segura.\n• Você pode gerenciar ou cancelar sua assinatura a qualquer momento.`,
  },
];

const AjudaPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-svh flex flex-col pb-20 bg-background">
      <header className="px-5 pt-[env(safe-area-inset-top)] mt-4 mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-muted/50 transition-colors">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-xl font-display">Como usar o app</h1>
      </header>

      <div className="flex-1 px-5">
        <p className="text-sm text-muted-foreground mb-5">
          Guia completo para configurar e usar todos os recursos do app.
        </p>

        <Accordion type="single" collapsible className="space-y-2">
          {sections.map((section, i) => (
            <AccordionItem key={i} value={`section-${i}`} className="border-none rounded-2xl bg-card shadow-card overflow-hidden">
              <AccordionTrigger className="px-4 py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <section.icon size={18} className="text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground text-left">{section.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {section.content}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default AjudaPage;
