import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, AlertTriangle, Eye, Plus } from "lucide-react";

type IncidentType = "agressao" | "assedio" | "suspeito" | "stalking";

interface Incident {
  id: string;
  type: IncidentType;
  description: string;
  time: string;
  distance: string;
}

const incidentConfig: Record<IncidentType, { label: string; color: string; bgClass: string }> = {
  agressao: { label: "Agressão", color: "text-destructive", bgClass: "bg-destructive/10" },
  assedio: { label: "Assédio", color: "text-warning", bgClass: "bg-warning/10" },
  suspeito: { label: "Suspeito", color: "text-caution", bgClass: "bg-caution/10" },
  stalking: { label: "Stalking", color: "text-primary", bgClass: "bg-primary/10" },
};

const mockIncidents: Incident[] = [
  { id: "1", type: "assedio", description: "Assédio verbal na Av. Paulista", time: "2h atrás", distance: "300m" },
  { id: "2", type: "agressao", description: "Tentativa de agressão na Rua Augusta", time: "5h atrás", distance: "1.2km" },
  { id: "3", type: "suspeito", description: "Comportamento suspeito na praça", time: "1d atrás", distance: "800m" },
  { id: "4", type: "stalking", description: "Perseguição constante no trajeto casa-trabalho", time: "3h atrás", distance: "500m" },
];

const MapaPage = () => {
  const [filter, setFilter] = useState<IncidentType | "all">("all");

  const filtered = filter === "all" ? mockIncidents : mockIncidents.filter((i) => i.type === filter);

  return (
    <div className="min-h-svh flex flex-col pb-20 bg-background">
      {/* Map placeholder */}
      <div className="relative h-[45vh] bg-muted flex items-center justify-center">
        <div className="text-center space-y-2">
          <MapPin className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Mapa de Risco</p>
          <p className="text-xs text-muted-foreground">Conecte uma API de mapas para visualizar</p>
        </div>

        {/* Mock markers */}
        <div className="absolute top-1/4 left-1/3 w-4 h-4 rounded-full bg-destructive shadow-elevated" />
        <div className="absolute top-1/2 right-1/4 w-4 h-4 rounded-full bg-warning shadow-elevated" />
        <div className="absolute bottom-1/3 left-1/2 w-4 h-4 rounded-full bg-caution shadow-elevated" />
        <div className="absolute top-1/3 right-1/3 w-4 h-4 rounded-full bg-primary shadow-elevated" />
      </div>

      {/* Filters */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto">
        {[
          { key: "all" as const, label: "Todos" },
          { key: "agressao" as const, label: "Agressão" },
          { key: "assedio" as const, label: "Assédio" },
          { key: "suspeito" as const, label: "Suspeito" },
        ].map((f) => (
          <motion.button
            key={f.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {f.label}
          </motion.button>
        ))}
      </div>

      {/* Incident list */}
      <div className="flex-1 px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-display">Incidentes recentes</h2>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
          >
            <Plus size={16} />
            Reportar
          </motion.button>
        </div>

        <div className="space-y-2">
          {filtered.map((incident) => {
            const config = incidentConfig[incident.type];
            return (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-card shadow-card"
              >
                <div className={`w-10 h-10 rounded-xl ${config.bgClass} flex items-center justify-center`}>
                  <AlertTriangle size={18} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{incident.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                    <span className="text-xs text-muted-foreground">· {incident.time}</span>
                    <span className="text-xs text-muted-foreground">· {incident.distance}</span>
                  </div>
                </div>
                <Eye size={16} className="text-muted-foreground flex-shrink-0" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MapaPage;
