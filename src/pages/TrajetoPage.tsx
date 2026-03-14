import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navigation, MapPin, Clock, Shield, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import PaymentPopup from "@/components/PaymentPopup";

const TrajetoPage = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [destination, setDestination] = useState("");
  const { subscribed, subscriptionLoading } = useAuth();
  const navigate = useNavigate();

  const startMonitoring = () => {
    if (!destination.trim()) return;
    setIsMonitoring(true);
  };

  if (!subscriptionLoading && !subscribed) {
    return (
      <div className="min-h-svh flex flex-col pb-20 bg-background relative">
        <div className="flex-1 filter blur-sm pointer-events-none opacity-50">
          <div className="px-5 pt-[env(safe-area-inset-top)] mt-4 mb-4">
            <h1 className="text-xl font-display">Monitoramento de Trajeto</h1>
          </div>
        </div>
        <PaymentPopup open={true} onClose={() => navigate("/")} />
      </div>
    );
  }

  return (
    <div className="min-h-svh flex flex-col pb-20 bg-background">
      {/* Header */}
      <header className="px-5 pt-[env(safe-area-inset-top)] mt-4 mb-4">
        <h1 className="text-xl font-display">Monitoramento de Trajeto</h1>
        <p className="text-sm text-muted-foreground mt-1">Estou indo para casa</p>
      </header>

      {!isMonitoring ? (
        <div className="flex-1 px-5 space-y-6">
          {/* Destination input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Destino</label>
            <div className="relative">
              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Para onde você vai?"
                className="w-full pl-11 pr-4 py-4 rounded-xl bg-card border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Info cards */}
          <div className="space-y-3">
            {[
              { icon: Navigation, title: "Monitoramento automático", desc: "O app acompanha sua rota em tempo real" },
              { icon: Clock, title: "Detecção de parada", desc: "Alerta se você parar por muito tempo" },
              { icon: Shield, title: "Alerta automático", desc: "Se não responder em 60s, contatos são notificados" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 p-4 rounded-2xl bg-card shadow-card"
              >
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                  <item.icon size={18} className="text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Start button */}
          <motion.button
            onClick={startMonitoring}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", duration: 0.2, bounce: 0 }}
            className={`w-full py-4 rounded-xl font-display text-lg transition-colors ${
              destination.trim()
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            Ativar Monitoramento
          </motion.button>
        </div>
      ) : (
        <div className="flex-1 px-5 space-y-6">
          {/* Monitoring active */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center space-y-3"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Navigation size={28} className="text-primary" />
            </div>
            <h2 className="text-lg font-display text-foreground">Monitoramento Ativo</h2>
            <p className="text-sm text-muted-foreground">Indo para: {destination}</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Distância", value: "2.4 km" },
              { label: "Tempo est.", value: "18 min" },
              { label: "Atualização", value: "3s" },
            ].map((stat) => (
              <div key={stat.label} className="p-3 rounded-xl bg-card shadow-card text-center">
                <p className="text-lg font-display tabular-nums text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-card shadow-card">
            <CheckCircle2 size={20} className="text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Tudo seguro</p>
              <p className="text-xs text-muted-foreground">Nenhum desvio detectado</p>
            </div>
          </div>

          {/* Cancel */}
          <motion.button
            onClick={() => setIsMonitoring(false)}
            whileTap={{ scale: 0.95 }}
            className="w-full py-4 rounded-xl bg-muted text-muted-foreground font-display text-base"
          >
            Encerrar Monitoramento
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default TrajetoPage;
