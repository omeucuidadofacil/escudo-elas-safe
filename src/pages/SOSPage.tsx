import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2 } from "lucide-react";
import SOSButton from "@/components/SOSButton";
import { toast } from "sonner";

const SOSPage = () => {
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  const handleActivate = useCallback(() => {
    // Flash red
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 200);
    setIsAlertActive(true);
    toast.success("Alerta ativado. Contatos notificados.", {
      duration: 5000,
    });
  }, []);

  const handleCancel = useCallback(() => {
    setIsAlertActive(false);
    toast.info("Alerta cancelado.");
  }, []);

  return (
    <div
      className={`min-h-svh flex flex-col pb-20 transition-colors duration-300 ${
        isAlertActive ? "bg-alert text-alert-foreground" : "bg-background"
      }`}
    >
      {/* Red flash overlay */}
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

      {/* Header */}
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

      {/* SOS Button Area */}
      <SOSButton
        onActivate={handleActivate}
        onCancel={handleCancel}
        isActive={isAlertActive}
      />

      {/* Silent activation hint */}
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
