import { Home, Map, Shield, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const protectedPaths = ["/mapa", "/trajeto", "/config", "/painel"];

const tabs = [
  { path: "/", icon: Home, label: "Início" },
  { path: "/mapa", icon: Map, label: "Mapa" },
  { path: "/sos", icon: Shield, label: "SOS", isCenter: true },
  { path: "/config", icon: Settings, label: "Ajustes" },
  { path: "/painel", icon: Shield, label: "Proteção" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, cadastroCompleto } = useAuth();

  const hiddenRoutes = ["/onboarding", "/completar-cadastro", "/admin", "/login", "/cadastro"];
  if (hiddenRoutes.some(r => location.pathname.startsWith(r))) {
    return null;
  }

  const handleNav = (path: string) => {
    if (protectedPaths.includes(path) && !user) {
      toast("Cadastre-se para acessar este recurso", {
        description: "Crie sua conta para usar todas as funcionalidades",
        action: {
          label: "Cadastrar",
          onClick: () => navigate("/cadastro"),
        },
      });
      return;
    }
    if (protectedPaths.includes(path) && user && !cadastroCompleto) {
      navigate("/completar-cadastro");
      return;
    }
    navigate(path);
  };

  // Reorder: Início, Mapa, SOS (center), Proteção, Ajustes
  const orderedTabs = [
    { path: "/", icon: Home, label: "Início" },
    { path: "/mapa", icon: Map, label: "Mapa" },
    { path: "/sos", icon: Shield, label: "SOS", isCenter: true },
    { path: "/painel", icon: Shield, label: "Proteção" },
    { path: "/config", icon: Settings, label: "Ajustes" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around max-w-md mx-auto h-16 relative">
        {orderedTabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          if (tab.isCenter) {
            return (
              <motion.button
                key={tab.path}
                onClick={() => handleNav(tab.path)}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", duration: 0.2, bounce: 0 }}
                className="relative -mt-6 flex items-center justify-center"
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-elevated"
                  style={{ background: "linear-gradient(180deg, hsl(15 90% 55%), hsl(0 85% 55%))" }}
                >
                  <span className="text-xs font-bold text-white tracking-wider">SOS</span>
                </div>
              </motion.button>
            );
          }

          return (
            <motion.button
              key={tab.path}
              onClick={() => handleNav(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", duration: 0.2, bounce: 0 }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

export default BottomNav;
