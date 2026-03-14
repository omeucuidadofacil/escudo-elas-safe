import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";

interface SOSButtonProps {
  onActivate: () => void;
  onCancel: () => void;
  isActive: boolean;
}

const HOLD_DURATION = 3000; // 3 seconds

const SOSButton = ({ onActivate, onCancel, isActive }: SOSButtonProps) => {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startHold = useCallback(() => {
    if (isActive) return;
    setIsHolding(true);
    startTimeRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(elapsed / HOLD_DURATION, 1);
      setProgress(p);

      if (p >= 1) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setIsHolding(false);
        onActivate();
      }
    }, 16);
  }, [isActive, onActivate]);

  const endHold = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsHolding(false);
    setProgress(0);
  }, []);

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6">
      <AnimatePresence mode="wait">
        {!isActive ? (
          <motion.div
            key="sos"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            className="relative flex items-center justify-center"
          >
            {/* Pulse rings - always visible */}
            <motion.div
              className="absolute w-64 h-64 rounded-full border-2 border-primary/30"
              animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute w-64 h-64 rounded-full border-2 border-primary/20"
              animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            />

            {/* Progress circle */}
            <svg className="absolute w-64 h-64 -rotate-90" viewBox="0 0 260 260">
              <circle
                cx="130"
                cy="130"
                r="120"
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="4"
              />
              <circle
                cx="130"
                cy="130"
                r="120"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-none"
              />
            </svg>

            {/* Main button */}
            <motion.button
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              onContextMenu={(e) => e.preventDefault()}
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 0 0 hsl(270 60% 55% / 0.4)",
                  "0 0 0 20px hsl(270 60% 55% / 0)",
                  "0 0 0 0 hsl(270 60% 55% / 0)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              whileTap={{ scale: 0.97 }}
              className="relative z-10 w-56 h-56 rounded-full bg-primary flex flex-col items-center justify-center select-none touch-none shadow-elevated"
            >
              <Shield className="w-12 h-12 text-primary-foreground mb-2" strokeWidth={2.5} />
              <span className="text-5xl font-display text-primary-foreground">SOS</span>
            </motion.button>

            <p className="absolute -bottom-12 text-sm text-muted-foreground text-center">
              {isHolding ? "Continue segurando..." : "Pressione e segure por 3s"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-56 h-56 rounded-full bg-destructive flex flex-col items-center justify-center animate-pulse">
              <Shield className="w-10 h-10 text-destructive-foreground mb-2" strokeWidth={2.5} />
              <span className="text-2xl font-display text-destructive-foreground">ALERTA ATIVO</span>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-foreground">Contatos notificados</p>
              <p className="text-xs text-muted-foreground">Localização sendo compartilhada</p>
            </div>

            <motion.button
              onClick={onCancel}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", duration: 0.2, bounce: 0 }}
              className="mt-4 px-8 py-4 rounded-xl bg-destructive text-destructive-foreground font-display text-lg"
            >
              CANCELAR ALERTA
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SOSButton;
