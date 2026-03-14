import { useState } from "react";
import { motion } from "framer-motion";
import { X, MapPin, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type IncidentType = "agressao" | "assedio" | "suspeito" | "stalking";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TYPES: { value: IncidentType; label: string }[] = [
  { value: "agressao", label: "Agressão" },
  { value: "assedio", label: "Assédio" },
  { value: "suspeito", label: "Suspeito" },
  { value: "stalking", label: "Stalking" },
];

const ReportIncidentModal = ({ open, onClose, onSuccess }: Props) => {
  const { user } = useAuth();
  const [tipo, setTipo] = useState<IncidentType>("assedio");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Você precisa estar logada");
      return;
    }
    if (!descricao.trim()) {
      toast.error("Descreva o incidente");
      return;
    }

    setSaving(true);
    setGettingLocation(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      setGettingLocation(false);

      const { error } = await supabase.from("incidentes").insert({
        user_id: user.id,
        tipo,
        descricao: descricao.trim(),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (error) throw error;

      toast.success("Incidente reportado com sucesso");
      setDescricao("");
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err?.code === 1) {
        toast.error("Permita o acesso à localização para reportar");
      } else {
        toast.error("Erro ao reportar incidente");
      }
    } finally {
      setSaving(false);
      setGettingLocation(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl bg-card p-6 shadow-elevated space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-display text-foreground">Reportar Incidente</h3>
          <button onClick={onClose} className="p-1 text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Tipo</label>
          <div className="flex gap-2 flex-wrap">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTipo(t.value)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tipo === t.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva o que aconteceu..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary resize-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin size={14} />
          <span>Sua localização GPS atual será usada</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {gettingLocation ? "Obtendo localização..." : "Enviando..."}
            </>
          ) : (
            <>
              <Send size={16} />
              Reportar
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default ReportIncidentModal;
