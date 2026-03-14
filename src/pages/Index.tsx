import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { VolumeX, PhoneOff, Bell, ChevronRight, CheckCircle2, MapPin, UserPlus } from "lucide-react";
import logoElara from "@/assets/logo-elara.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, cadastroCompleto } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [profileRes, alertasRes] = await Promise.all([
        supabase.from("profiles").select("nome, foto_url").eq("user_id", user.id).maybeSingle(),
        supabase.from("alertas").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setProfile(profileRes.data);
      setRecentActivity(alertasRes.data || []);
    };
    load();
  }, [user]);

  const firstName = profile?.nome?.split(" ")[0] || "Visitante";

  return (
    <div className="min-h-svh flex flex-col pb-20 bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top)] mt-4">
        <div className="flex items-center gap-2">
          <img src={logoElara} alt="Elara" className="w-8 h-8 object-contain" />
          <span className="text-base font-bold text-primary">Elara</span>
          <span className="text-xs text-muted-foreground">O Escudo Delas</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
            <Bell size={18} className="text-primary" />
          </button>
          <div className="w-9 h-9 rounded-full bg-accent overflow-hidden flex items-center justify-center">
            {profile?.foto_url ? (
              <img src={profile.foto_url} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-primary">{firstName[0]}</span>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 px-5 mt-6 space-y-5">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Olá, {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {user ? "Sua proteção está ativa e monitorada." : "Cadastre-se para ativar sua proteção."}
          </p>
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">Ações Rápidas</p>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/sos")}
              className="p-5 rounded-2xl bg-card shadow-card flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <VolumeX size={24} className="text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Alarme Silencioso</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/sos")}
              className="p-5 rounded-2xl bg-card shadow-card flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/60 flex items-center justify-center">
                <PhoneOff size={24} className="text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Chamada Falsa</span>
            </motion.button>
          </div>
        </div>

        {/* Security Tip Card */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="relative overflow-hidden rounded-2xl p-5 text-white"
          style={{ background: "linear-gradient(135deg, hsl(270 80% 60%), hsl(250 80% 55%))" }}
        >
          <div className="absolute right-[-20px] bottom-[-20px] opacity-20">
            <Shield size={120} strokeWidth={1} />
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 px-2.5 py-1 rounded-full">
            Dica de Segurança
          </span>
          <h3 className="text-lg font-bold mt-3">Caminhando à noite?</h3>
          <p className="text-sm opacity-90 mt-1 max-w-[80%]">
            Ative o "Modo Acompanhamento" para compartilhar sua rota em tempo real com contatos de confiança.
          </p>
          <button
            onClick={() => navigate("/trajeto")}
            className="mt-4 px-4 py-2 rounded-xl bg-white text-primary font-semibold text-sm"
          >
            ATIVAR AGORA
          </button>
        </motion.div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Atividade Recente</p>
            {recentActivity.length > 0 && (
              <button onClick={() => navigate("/painel")} className="text-xs font-semibold text-primary">
                Ver tudo
              </button>
            )}
          </div>
          <div className="space-y-2">
            {!user ? (
              <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/cadastro")}
                className="p-4 rounded-2xl bg-card shadow-card flex items-center gap-3 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <UserPlus size={18} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Crie sua conta</p>
                  <p className="text-xs text-muted-foreground">Cadastre-se para usar todos os recursos</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </motion.div>
            ) : recentActivity.length === 0 ? (
              <div className="p-6 rounded-2xl bg-card shadow-card text-center">
                <CheckCircle2 size={28} className="mx-auto text-primary/40 mb-2" />
                <p className="text-sm text-muted-foreground">Tudo tranquilo por aqui</p>
              </div>
            ) : (
              recentActivity.map((a: any) => (
                <div key={a.id} className="p-4 rounded-2xl bg-card shadow-card flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    a.status === "ativo" ? "bg-destructive/10" : a.status === "cancelado" ? "bg-muted" : "bg-primary/10"
                  }`}>
                    {a.status === "ativo" ? (
                      <Shield size={18} className="text-destructive" />
                    ) : a.latitude ? (
                      <MapPin size={18} className="text-primary" />
                    ) : (
                      <CheckCircle2 size={18} className="text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {a.status === "ativo" ? "Alerta Ativo" : a.status === "cancelado" ? "Alerta Cancelado" : "Chegada em Segurança"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.tipo_alerta} · {new Date(a.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
