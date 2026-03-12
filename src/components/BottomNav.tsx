import { Shield, Map, Navigation, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const protectedPaths = ["/mapa", "/trajeto", "/config"];

const tabs = [
  { path: "/", icon: Shield, label: "SOS" },
  { path: "/mapa", icon: Map, label: "Mapa" },
  { path: "/trajeto", icon: Navigation, label: "Trajeto" },
  { path: "/config", icon: Settings, label: "Config" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, cadastroCompleto } = useAuth();

  const hiddenRoutes = ["/onboarding", "/completar-cadastro", "/admin"];
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  const handleNav = (path: string) => {
    if (protectedPaths.includes(path) && !user) {
      navigate("/cadastro");
      return;
    }
    if (protectedPaths.includes(path) && user && !cadastroCompleto) {
      navigate("/completar-cadastro");
      return;
    }
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around max-w-md mx-auto h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
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
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-medium">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

export default BottomNav;
