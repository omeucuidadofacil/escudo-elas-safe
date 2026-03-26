import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plano {
  id: string;
  nome: string;
  preco: number;
  intervalo: string;
  stripe_price_id: string | null;
}

interface PaymentPopupProps {
  open: boolean;
  onClose?: () => void;
}

const PaymentPopup = ({ open, onClose }: PaymentPopupProps) => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPlanos, setLoadingPlanos] = useState(true);

  useEffect(() => {
    if (open) {
      loadPlanos();
    }
  }, [open]);

  const loadPlanos = async () => {
    setLoadingPlanos(true);
    const { data } = await supabase
      .from("planos")
      .select("id, nome, preco, intervalo, stripe_price_id")
      .eq("ativo", true)
      .order("preco", { ascending: true });

    const list = (data || []) as Plano[];
    setPlanos(list);

    // Auto-select annual plan or first
    const annual = list.find((p) => p.intervalo === "year");
    setSelectedId(annual?.id || list[0]?.id || null);
    setLoadingPlanos(false);
  };

  const selectedPlano = planos.find((p) => p.id === selectedId);

  const handleCheckout = async () => {
    if (!selectedPlano?.stripe_price_id) {
      toast.error("Plano sem configuração de pagamento.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_id: selectedPlano.stripe_price_id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch {
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
    }
    setLoading(false);
  };

  const formatPrice = (plano: Plano) => {
    if (plano.intervalo === "year") {
      const monthly = plano.preco / 12;
      return {
        display: `R$ ${monthly.toFixed(2).replace(".", ",")}`,
        period: "/mês",
        total: `Total: R$ ${plano.preco.toFixed(2).replace(".", ",")}`,
      };
    }
    return {
      display: `R$ ${plano.preco.toFixed(2).replace(".", ",")}`,
      period: "/mês",
      total: null,
    };
  };

  const getEconomia = () => {
    const mensal = planos.find((p) => p.intervalo === "month");
    const anual = planos.find((p) => p.intervalo === "year");
    if (!mensal || !anual) return null;
    const totalMensal = mensal.preco * 12;
    const pct = Math.round(((totalMensal - anual.preco) / totalMensal) * 100);
    return pct > 0 ? `Economia de ${pct}%` : null;
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

            {loadingPlanos ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : planos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum plano disponível.</p>
            ) : (
              <div className="space-y-3">
                {planos.map((plano) => {
                  const prices = formatPrice(plano);
                  const isAnnual = plano.intervalo === "year";
                  const economia = isAnnual ? getEconomia() : null;

                  return (
                    <motion.button
                      key={plano.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedId(plano.id)}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-colors relative ${
                        selectedId === plano.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background"
                      }`}
                    >
                      {economia && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center gap-1">
                          <Sparkles size={10} /> {economia}
                        </span>
                      )}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{plano.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="text-lg font-display text-foreground">{prices.display}</span>
                            {prices.period}
                          </p>
                          {prices.total && (
                            <p className="text-[11px] text-muted-foreground">{prices.total}</p>
                          )}
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedId === plano.id ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}>
                          {selectedId === plano.id && <Check size={14} className="text-primary-foreground" />}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCheckout}
                disabled={loading || !selectedPlano}
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
