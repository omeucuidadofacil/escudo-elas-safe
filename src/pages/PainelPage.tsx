import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, MapPin, Clock, CheckCircle2, XCircle, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PainelPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [profileRes, alertasRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("alertas").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);
      setProfile(profileRes.data);
      setAlertas(alertasRes.data || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const formatDate = (d: string) => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-svh flex flex-col pb-20 bg-background">
      <header className="px-5 pt-[env(safe-area-inset-top)] mt-4 mb-4">
        <h1 className="text-xl font-display text-foreground">Meu Painel</h1>
      </header>

      <div className="flex-1 px-5 space-y-4">
        {/* Profile card */}
        <div className="p-5 rounded-2xl bg-card shadow-card">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {profile?.foto_url ? (
                <img src={profile.foto_url} className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-display text-foreground truncate">{profile?.nome || "Sem nome"}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
              {profile?.cidade && (
                <p className="text-xs text-muted-foreground">{profile.cidade}/{profile.estado}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${profile?.cadastro_completo ? "bg-primary/10 text-primary" : "bg-caution/10 text-caution"}`}>
              {profile?.cadastro_completo ? "Cadastro Completo" : "Cadastro Incompleto"}
            </span>
            <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${(profile as any)?.aprovado ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
              {(profile as any)?.aprovado ? "Conta Aprovada" : "Aguardando Aprovação"}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-card shadow-card text-center">
            <p className="text-xl font-display text-primary tabular-nums">{alertas.length}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Alertas</p>
          </div>
          <div className="p-3 rounded-2xl bg-card shadow-card text-center">
            <p className="text-xl font-display text-destructive tabular-nums">{alertas.filter(a => a.status === "ativo").length}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Ativos</p>
          </div>
          <div className="p-3 rounded-2xl bg-card shadow-card text-center">
            <p className="text-xl font-display text-muted-foreground tabular-nums">{alertas.filter(a => a.status === "cancelado").length}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Cancelados</p>
          </div>
        </div>

        {/* Alert history */}
        <div>
          <h2 className="text-sm font-display text-foreground mb-3">Histórico de Alertas</h2>
          <div className="space-y-2">
            {alertas.length === 0 && (
              <div className="p-6 rounded-2xl bg-card shadow-card text-center">
                <Shield size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum alerta registrado</p>
              </div>
            )}
            {alertas.map((a: any) => (
              <div key={a.id} className="p-4 rounded-2xl bg-card shadow-card flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.status === "ativo" ? "bg-destructive/10" : "bg-muted"}`}>
                  {a.status === "ativo" ? (
                    <AlertTriangle size={16} className="text-destructive" />
                  ) : (
                    <CheckCircle2 size={16} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${a.status === "ativo" ? "text-destructive" : "text-muted-foreground"}`}>
                      {a.status.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">· {a.tipo_alerta}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock size={10} className="text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground">{formatDate(a.created_at)}</p>
                  </div>
                  {a.latitude && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">{a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PainelPage;
