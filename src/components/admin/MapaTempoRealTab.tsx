import { useState, useEffect, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, MapPin, Users } from "lucide-react";
import { motion } from "framer-motion";

interface UserLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  created_at: string;
  nome?: string;
  email?: string;
}

const containerStyle = { width: "100%", height: "500px", borderRadius: "1rem" };
const defaultCenter = { lat: -14.235, lng: -51.9253 };

const MapaTempoRealTab = () => {
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  useEffect(() => {
    loadApiKey();
  }, []);

  useEffect(() => {
    if (apiKey) loadLocations();
  }, [apiKey]);

  useEffect(() => {
    if (!autoRefresh || !apiKey) return;
    const interval = setInterval(loadLocations, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, apiKey]);

  const loadApiKey = async () => {
    const { data } = await supabase
      .from("api_keys")
      .select("chave")
      .eq("servico", "google_maps")
      .eq("ativo", true)
      .limit(1)
      .single();
    if (data?.chave) setApiKey(data.chave);
  };

  const loadLocations = async () => {
    setLoading(true);
    // Get latest location per user
    const { data: locData } = await supabase
      .from("localizacao_tempo_real")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (locData && locData.length > 0) {
      // Get unique users (latest entry per user)
      const seen = new Set<string>();
      const unique: typeof locData = [];
      for (const loc of locData) {
        if (!seen.has(loc.user_id)) {
          seen.add(loc.user_id);
          unique.push(loc);
        }
      }

      // Fetch profile names
      const userIds = unique.map((l) => l.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, nome, email")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const enriched: UserLocation[] = unique.map((l) => {
        const profile = profileMap.get(l.user_id) as any;
        return {
          ...l,
          nome: profile?.nome || "Sem nome",
          email: profile?.email || "",
        };
      });
      setLocations(enriched);
    } else {
      setLocations([]);
    }
    setLoading(false);
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    if (locations.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      locations.forEach((l) => bounds.extend({ lat: l.latitude, lng: l.longitude }));
      map.fitBounds(bounds);
    }
  }, [locations]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  if (!apiKey) {
    return (
      <div className="rounded-2xl bg-card shadow-card border border-border p-8 text-center space-y-3">
        <MapPin size={40} className="mx-auto text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Configure uma API Key do Google Maps na aba <strong>APIs</strong> para visualizar o mapa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            <Users size={12} className="inline mr-1" />
            {locations.length} usuária(s) rastreada(s)
          </p>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh (15s)
          </label>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={loadLocations}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Atualizar
        </motion.button>
      </div>

      <div className="rounded-2xl bg-card shadow-card border border-border overflow-hidden">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={locations.length > 0 ? { lat: locations[0].latitude, lng: locations[0].longitude } : defaultCenter}
            zoom={locations.length > 0 ? 12 : 4}
            onLoad={onMapLoad}
            options={{
              styles: [
                { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#8b8ba7" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
                { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a4a" }] },
                { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e0e1a" }] },
              ],
            }}
          >
            {locations.map((loc) => (
              <Marker
                key={loc.id}
                position={{ lat: loc.latitude, lng: loc.longitude }}
                onClick={() => setSelectedUser(loc)}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: "#a855f7",
                  fillOpacity: 1,
                  strokeColor: "#7c3aed",
                  strokeWeight: 3,
                }}
              />
            ))}
            {selectedUser && (
              <InfoWindow
                position={{ lat: selectedUser.latitude, lng: selectedUser.longitude }}
                onCloseClick={() => setSelectedUser(null)}
              >
                <div className="p-1 text-xs text-gray-800">
                  <p className="font-bold">{selectedUser.nome}</p>
                  <p>{selectedUser.email}</p>
                  <p className="text-gray-500 mt-1">
                    Última atualização: {formatDate(selectedUser.created_at)}
                  </p>
                  <p className="text-gray-500">
                    {selectedUser.latitude.toFixed(5)}, {selectedUser.longitude.toFixed(5)}
                  </p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div className="h-[500px] flex items-center justify-center">
            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* User list */}
      {locations.length > 0 && (
        <div className="rounded-2xl bg-card shadow-card border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Usuária</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Coordenadas</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Última Atualização</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((loc) => (
                <tr
                  key={loc.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => setSelectedUser(loc)}
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-foreground">{loc.nome}</p>
                    <p className="text-xs text-muted-foreground">{loc.email}</p>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground font-mono text-xs">
                    {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{formatDate(loc.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {locations.length === 0 && !loading && (
        <p className="text-xs text-muted-foreground text-center py-8">
          Nenhuma localização em tempo real registrada.
        </p>
      )}
    </div>
  );
};

export default MapaTempoRealTab;
