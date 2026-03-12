import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Shield, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SOSButton from "@/components/SOSButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const SOSPage = () => {
  const { user, cadastroCompleto } = useAuth();
  const navigate = useNavigate();
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  const requireAuth = useCallback(() => {
    if (!user) {
      navigate("/cadastro");
      return false;
    }
    if (!cadastroCompleto) {
      navigate("/completar-cadastro");
      return false;
    }
    return true;
  }, [user, cadastroCompleto, navigate]);

  const handleActivate = useCallback(async () => {
    if (!requireAuth()) return;

    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);
    setIsAlertActive(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await supabase.from("alertas").insert({
            user_id: user!.id,
            tipo_alerta: "sos",
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            status: "ativo",
          });
          await supabase.from("localizacao_tempo_real").insert({
            user_id: user!.id,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {
          supabase.from("alertas").insert({
            user_id: user!.id,
            tipo_alerta: "sos",
            status: "ativo",
          });
        }
      );
    }

    toast.success("Alerta ativado. Contatos notificados.", { duration: 5000 });
  }, [user, requireAuth]);

  const handleCancel = useCallback(async () => {
    setIsAlertActive(false);
    if (user) {
      const { data } = await supabase
        .from("alertas")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        await supabase.from("alertas").update({ status: "cancelado" }).eq("id", data[0].id);
      }
    }
    toast.info("Alerta cancelado.");
  }, [user]);

  return (
    <div
      className={`min-h-svh flex flex-col pb-20 transition-colors duration-300 ${
        isAlertActive ? "bg-alert text-alert-foreground" : "bg-background"
      }`}
    >
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-50 bg-destructive/80 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top)] mt-4">
        <div>
          <h1 className="text-lg font-display text-foreground">
            {isAlertActive ? "" : "Escudo Delas"}
          </h1>
        </div>
        {isAlertActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/20"
          >
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-medium text-destructive">ALERTA ATIVADO</span>
          </motion.div>
        )}
      </header>

      <SOSButton
        onActivate={handleActivate}
        onCancel={handleCancel}
        isActive={isAlertActive}
      />

      {!isAlertActive && (
        <div className="px-6 pb-6 flex justify-center">
          <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted text-muted-foreground text-sm">
            <Volume2 size={16} />
            <span>Ativação silenciosa</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SOSPage;
