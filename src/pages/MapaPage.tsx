import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, AlertTriangle, Eye, Plus, Loader2 } from "lucide-react";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PaymentPopup from "@/components/PaymentPopup";
import ReportIncidentModal from "@/components/ReportIncidentModal";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type IncidentType = "agressao" | "assedio" | "suspeito" | "stalking";

interface Incident {
  id: string;
  tipo: string;
  descricao: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
}

const incidentConfig: Record<IncidentType, { label: string; color: string; bgClass: string; markerColor: string }> = {
  agressao: { label: "Agressão", color: "text-destructive", bgClass: "bg-destructive/10", markerColor: "#e74c3c" },
  assedio: { label: "Assédio", color: "text-warning", bgClass: "bg-warning/10", markerColor: "#e67e22" },
  suspeito: { label: "Suspeito", color: "text-caution", bgClass: "bg-caution/10", markerColor: "#f1c40f" },
  stalking: { label: "Stalking", color: "text-primary", bgClass: "bg-primary/10", markerColor: "#8b5cf6" },
};

const SAO_PAULO = { lat: -23.5505, lng: -46.6333 };

const mapContainerStyle = { width: "100%", height: "100%" };

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
  ],
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
}

function createMarkerIcon(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const MapaPage = () => {
  const [filter, setFilter] = useState<IncidentType | "all">("all");
  const { user, subscribed, subscriptionLoading } = useAuth();
  const navigate = useNavigate();

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showReport, setShowReport] = useState(false);

  // Fetch Google Maps API key from api_keys table
  useEffect(() => {
    const fetchKey = async () => {
      const { data } = await supabase
        .from("api_keys")
        .select("chave")
        .eq("servico", "google_maps")
        .eq("ativo", true)
        .limit(1);
      setApiKey(data?.[0]?.chave || null);
      setApiKeyLoading(false);
    };
    fetchKey();
  }, []);

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserPos(SAO_PAULO),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Fetch incidents
  const loadIncidents = useCallback(async () => {
    const { data } = await supabase
      .from("incidentes")
      .select("id, tipo, descricao, latitude, longitude, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    setIncidents(data || []);
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const filtered = useMemo(
    () => (filter === "all" ? incidents : incidents.filter((i) => i.tipo === filter)),
    [filter, incidents]
  );

  const center = userPos || SAO_PAULO;

  if (!subscriptionLoading && !subscribed) {
    return (
      <div className="min-h-svh flex flex-col pb-20 bg-background relative">
        <div className="flex-1 filter blur-sm pointer-events-none opacity-50">
          <div className="relative h-[45vh] bg-muted flex items-center justify-center">
            <MapPin className="w-10 h-10 text-muted-foreground mx-auto" />
          </div>
        </div>
        <PaymentPopup open={true} onClose={() => navigate("/")} />
      </div>
    );
  }

  return (
    <div className="min-h-svh flex flex-col pb-20 bg-background">
      {/* Map */}
      <div className="relative h-[45vh] bg-muted">
        {apiKeyLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
        ) : apiKey ? (
          <LoadScript googleMapsApiKey={apiKey}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={14}
              options={mapOptions}
            >
              {/* User location marker */}
              {userPos && (
                <Marker
                  position={userPos}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#8b5cf6",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 3,
                  }}
                  zIndex={999}
                />
              )}

              {/* Incident markers */}
              {filtered.map((incident) => {
                const config = incidentConfig[incident.tipo as IncidentType];
                if (!config) return null;
                return (
                  <Marker
                    key={incident.id}
                    position={{ lat: incident.latitude, lng: incident.longitude }}
                    icon={{
                      url: createMarkerIcon(config.markerColor),
                      scaledSize: new google.maps.Size(28, 42),
                      anchor: new google.maps.Point(14, 42),
                    }}
                    onClick={() => setSelectedIncident(incident)}
                  />
                );
              })}

              {/* InfoWindow */}
              {selectedIncident && (
                <InfoWindow
                  position={{ lat: selectedIncident.latitude, lng: selectedIncident.longitude }}
                  onCloseClick={() => setSelectedIncident(null)}
                >
                  <div className="p-1 max-w-[200px]">
                    <p className="font-semibold text-sm" style={{ color: incidentConfig[selectedIncident.tipo as IncidentType]?.markerColor }}>
                      {incidentConfig[selectedIncident.tipo as IncidentType]?.label}
                    </p>
                    <p className="text-xs text-gray-700 mt-1">{selectedIncident.descricao || "Sem descrição"}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(selectedIncident.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </LoadScript>
        ) : (
          <div className="flex items-center justify-center h-full text-center px-4">
            <div className="space-y-2">
              <MapPin className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Mapa de Risco</p>
              <p className="text-xs text-muted-foreground">
                Configure a API Key do Google Maps no painel admin para ativar o mapa
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto">
        {[
          { key: "all" as const, label: "Todos" },
          { key: "agressao" as const, label: "Agressão" },
          { key: "assedio" as const, label: "Assédio" },
          { key: "suspeito" as const, label: "Suspeito" },
          { key: "stalking" as const, label: "Stalking" },
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
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
          >
            <Plus size={16} />
            Reportar
          </motion.button>
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhum incidente encontrado</p>
          )}
          {filtered.map((incident) => {
            const config = incidentConfig[incident.tipo as IncidentType];
            if (!config) return null;
            const distance = userPos
              ? haversineDistance(userPos.lat, userPos.lng, incident.latitude, incident.longitude)
              : "";
            const timeAgo = formatDistanceToNow(new Date(incident.created_at), { addSuffix: true, locale: ptBR });
            return (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-card shadow-card cursor-pointer"
                onClick={() => setSelectedIncident(incident)}
              >
                <div className={`w-10 h-10 rounded-xl ${config.bgClass} flex items-center justify-center`}>
                  <AlertTriangle size={18} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {incident.descricao || config.label}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                    <span className="text-xs text-muted-foreground">· {timeAgo}</span>
                    {distance && <span className="text-xs text-muted-foreground">· {distance}</span>}
                  </div>
                </div>
                <Eye size={16} className="text-muted-foreground flex-shrink-0" />
              </motion.div>
            );
          })}
        </div>
      </div>

      <ReportIncidentModal
        open={showReport}
        onClose={() => setShowReport(false)}
        onSuccess={loadIncidents}
      />
    </div>
  );
};

export default MapaPage;
