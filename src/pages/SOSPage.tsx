import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoElara from "@/assets/logo-elara.png";
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

    let latitude: number | undefined;
    let longitude: number | undefined;

    const sendAlert = async (lat?: number, lng?: number) => {
      await supabase.from("alertas").insert({
        user_id: user!.id,
        tipo_alerta: "sos",
        latitude: lat,
        longitude: lng,
        status: "ativo",
      });
      if (lat && lng) {
        await supabase.from("localizacao_tempo_real").insert({
          user_id: user!.id,
          latitude: lat,
          longitude: lng,
        });
      }
      // Send Telegram notifications
      try {
        await supabase.functions.invoke("send-sos-alert", {
          body: { user_id: user!.id, latitude: lat, longitude: lng },
        });
      } catch (e) {
        console.error("Error sending SOS alert notifications:", e);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendAlert(pos.coords.latitude, pos.coords.longitude),
        () => sendAlert()
      );
    } else {
      await sendAlert();
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

      {/* Banner de cadastro para visitantes */}
      {!user && !isAlertActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-5 mt-2 p-3 rounded-xl bg-accent border border-primary/15 flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/cadastro")}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">Cadastre-se para sua proteção</p>
            <p className="text-[11px] text-muted-foreground">Ative alertas, compartilhe localização e mais</p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
        </motion.div>
      )}

      <header className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top)] mt-4">
        <div>
          {!isAlertActive && (
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <motion.div
                  className="absolute w-10 h-10 rounded-full border border-primary/30"
                  animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute w-10 h-10 rounded-full border border-primary/20"
                  animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                />
                <motion.div
                  className="w-9 h-9 rounded-full bg-primary flex items-center justify-center"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Shield className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
                </motion.div>
              </div>
              <div>
                <h1 className="text-lg font-display text-foreground">Valkyra</h1>
                <span className="text-xs text-muted-foreground">O Escudo Delas</span>
              </div>
            </div>
          )}
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
