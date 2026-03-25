import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PLANS = {
  monthly: {
    price_id: "price_MONTHLY_PLACEHOLDER",
    product_id: "prod_U8SO6uIdyGJ9lR",
    label: "Mensal",
    price: "R$ 7,99",
    period: "/mês",
    highlight: false,
  },
  annual: {
    price_id: "price_ANNUAL_PLACEHOLDER",
    product_id: "prod_U8SQMr85ggMrov",
    label: "Anual",
    price: "R$ 5,99",
    period: "/mês",
    badge: "Economia de 25%",
    highlight: true,
  },
};

interface PaymentPopupProps {
  open: boolean;
  onClose?: () => void;
}

const PaymentPopup = ({ open, onClose }: PaymentPopupProps) => {
  const [selected, setSelected] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const plan = PLANS[selected];
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_id: plan.price_id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-5"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
            className="w-full max-w-sm bg-card rounded-3xl p-6 space-y-5 shadow-elevated relative"
          >
            {onClose && (
              <button onClick={onClose} className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            )}

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-3">
                <Shield className="w-7 h-7 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-display text-foreground">Ative sua proteção</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Escolha o plano ideal para manter você segura 24h por dia.
              </p>
            </div>

            <div className="space-y-3">
              {(Object.entries(PLANS) as [keyof typeof PLANS, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelected(key)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-colors relative ${
                    selected === key
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background"
                  }`}
                >
                  {"badge" in plan && plan.badge && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center gap-1">
                      <Sparkles size={10} /> {plan.badge}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{plan.label}</p>
                      <p className="text-sm text-muted-foreground">
                        <span className="text-lg font-display text-foreground">{plan.price}</span>
                        {plan.period}
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selected === key ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}>
                      {selected === key && <Check size={14} className="text-primary-foreground" />}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCheckout}
                disabled={loading}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-display text-base disabled:opacity-50"
              >
                {loading ? "Processando..." : "Assinar agora"}
              </motion.button>
              <p className="text-[11px] text-muted-foreground text-center">
                Pagamento seguro via Stripe. Cancele quando quiser.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-medium text-foreground">O que está incluso:</p>
              {[
                "Botão SOS com alerta em tempo real",
                "Compartilhamento de localização",
                "Mapa de incidentes da região",
                "Contatos de emergência ilimitados",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check size={14} className="text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentPopup;
