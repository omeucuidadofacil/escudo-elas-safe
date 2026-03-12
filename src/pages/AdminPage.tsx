import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Users, AlertTriangle, MapPin, BarChart3, Eye, Trash2, Ban, CheckCircle2, LogOut, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Tab = "dashboard" | "usuarios" | "alertas" | "incidentes" | "contatos";

const AdminPage = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState({ usuarios: 0, alertasAtivos: 0, totalAlertas: 0, incidentes: 0 });
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [incidentes, setIncidentes] = useState<any[]>([]);
  const [contatos, setContatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [profilesRes, alertasRes, incidentesRes, contatosRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("alertas").select("*").order("created_at", { ascending: false }),
      supabase.from("incidentes").select("*").order("created_at", { ascending: false }),
      supabase.from("contatos_emergencia").select("*").order("created_at", { ascending: false }),
    ]);

    const profiles = profilesRes.data || [];
    const alertasData = alertasRes.data || [];
    const incidentesData = incidentesRes.data || [];
    const contatosData = contatosRes.data || [];

    setUsuarios(profiles);
    setAlertas(alertasData);
    setIncidentes(incidentesData);
    setContatos(contatosData);
    setStats({
      usuarios: profiles.length,
      alertasAtivos: alertasData.filter((a: any) => a.status === "ativo").length,
      totalAlertas: alertasData.length,
      incidentes: incidentesData.length,
    });
    setLoading(false);
  };

  const cancelAlert = async (id: string) => {
    await supabase.from("alertas").update({ status: "cancelado" }).eq("id", id);
    toast.success("Alerta cancelado");
    loadData();
  };

  const deleteIncident = async (id: string) => {
    await supabase.from("incidentes").delete().eq("id", id);
    toast.success("Incidente removido");
    loadData();
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "dashboard", label: "Dashboard", icon: BarChart3 },
    { key: "usuarios", label: "Usuárias", icon: Users },
    { key: "alertas", label: "Alertas", icon: AlertTriangle },
    { key: "incidentes", label: "Incidentes", icon: MapPin },
    { key: "contatos", label: "Contatos", icon: Users },
  ];

  const formatDate = (d: string) => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-5 pt-[env(safe-area-inset-top)] pb-3">
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="font-display text-foreground">Admin Master</h1>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleLogout} className="p-2 rounded-lg text-muted-foreground hover:text-destructive">
            <LogOut size={20} />
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
          {tabs.map((t) => (
            <motion.button
              key={t.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </motion.button>
          ))}
        </div>
      </header>

      <div className="px-5 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Dashboard */}
            {tab === "dashboard" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Usuárias", value: stats.usuarios, color: "text-primary" },
                    { label: "Alertas Ativos", value: stats.alertasAtivos, color: "text-destructive" },
                    { label: "Total Alertas", value: stats.totalAlertas, color: "text-warning" },
                    { label: "Incidentes", value: stats.incidentes, color: "text-caution" },
                  ].map((s) => (
                    <div key={s.label} className="p-4 rounded-2xl bg-card shadow-card">
                      <p className={`text-2xl font-display tabular-nums ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-card shadow-card">
                  <h3 className="text-sm font-display mb-3 text-foreground">Alertas Recentes</h3>
                  {alertas.slice(0, 5).map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <span className={`text-xs font-medium ${a.status === "ativo" ? "text-destructive" : "text-muted-foreground"}`}>
                          {a.status.toUpperCase()}
                        </span>
                        <p className="text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{a.tipo_alerta}</span>
                    </div>
                  ))}
                  {alertas.length === 0 && <p className="text-xs text-muted-foreground">Nenhum alerta registrado</p>}
                </div>
              </div>
            )}

            {/* Users */}
            {tab === "usuarios" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">{usuarios.length} usuária(s) cadastrada(s)</p>
                {usuarios.map((u: any) => (
                  <div key={u.id} className="p-4 rounded-2xl bg-card shadow-card">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {u.foto_url ? <img src={u.foto_url} className="w-full h-full object-cover" /> : <Users size={18} className="text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.nome || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${u.cadastro_completo ? "bg-primary/10 text-primary" : "bg-caution/10 text-caution"}`}>
                        {u.cadastro_completo ? "Completo" : "Incompleto"}
                      </span>
                    </div>
                    {u.cidade && <p className="text-xs text-muted-foreground mt-2">{u.cidade}/{u.estado}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Alerts */}
            {tab === "alertas" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">{alertas.length} alerta(s)</p>
                {alertas.map((a: any) => (
                  <div key={a.id} className="p-4 rounded-2xl bg-card shadow-card flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.status === "ativo" ? "bg-destructive/10" : "bg-muted"}`}>
                      <AlertTriangle size={18} className={a.status === "ativo" ? "text-destructive" : "text-muted-foreground"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${a.status === "ativo" ? "text-destructive" : "text-muted-foreground"}`}>
                          {a.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">· {a.tipo_alerta}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
                      {a.latitude && <p className="text-[10px] text-muted-foreground">📍 {a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}</p>}
                    </div>
                    {a.status === "ativo" && (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => cancelAlert(a.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive">
                        <Ban size={16} />
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Incidents */}
            {tab === "incidentes" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">{incidentes.length} incidente(s)</p>
                {incidentes.map((i: any) => (
                  <div key={i.id} className="p-4 rounded-2xl bg-card shadow-card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                      <MapPin size={18} className="text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{i.tipo}</p>
                      {i.descricao && <p className="text-xs text-muted-foreground truncate">{i.descricao}</p>}
                      <p className="text-xs text-muted-foreground">{formatDate(i.created_at)}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => deleteIncident(i.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive">
                      <Trash2 size={16} />
                    </motion.button>
                  </div>
                ))}
              </div>
            )}

            {/* Contacts */}
            {tab === "contatos" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">{contatos.length} contato(s) de emergência</p>
                {contatos.map((c: any) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-card shadow-card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{c.nome}</p>
                      <p className="text-xs text-muted-foreground">{c.telefone} · {c.relacao}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
