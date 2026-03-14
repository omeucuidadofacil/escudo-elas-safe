import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, AlertTriangle, MapPin, BarChart3, Trash2, Ban,
  CheckCircle2, LogOut, XCircle, Edit3, X, Save, Key, CreditCard,
  Code, Settings, Bell, Search, Activity, TrendingUp, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import PlanosTab from "@/components/admin/PlanosTab";
import ApiKeysTab from "@/components/admin/ApiKeysTab";

type Tab = "dashboard" | "usuarios" | "alertas" | "incidentes" | "planos" | "apis" | "config";

const sidebarTabs: { key: Tab; label: string; icon: any }[] = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "usuarios", label: "Usuárias", icon: Users },
  { key: "alertas", label: "Alertas", icon: Bell },
  { key: "incidentes", label: "Incidentes", icon: AlertTriangle },
  { key: "planos", label: "Planos", icon: CreditCard },
  { key: "apis", label: "APIs", icon: Code },
  { key: "config", label: "Configurações", icon: Settings },
];

const AdminPage = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState({ usuarios: 0, alertasAtivos: 0, totalAlertas: 0, incidentes: 0 });
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [incidentes, setIncidentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", email: "", telefone: "", cidade: "", estado: "" });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stripeKey, setStripeKey] = useState("");
  const [stripeLoading, setStripeLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [profilesRes, alertasRes, incidentesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("alertas").select("*").order("created_at", { ascending: false }),
      supabase.from("incidentes").select("*").order("created_at", { ascending: false }),
    ]);
    const profiles = profilesRes.data || [];
    const alertasData = alertasRes.data || [];
    const incidentesData = incidentesRes.data || [];
    setUsuarios(profiles);
    setAlertas(alertasData);
    setIncidentes(incidentesData);
    setStats({
      usuarios: profiles.length,
      alertasAtivos: alertasData.filter((a: any) => a.status === "ativo").length,
      totalAlertas: alertasData.length,
      incidentes: incidentesData.length,
    });
    setLoading(false);
  };

  const approveUser = async (userId: string) => {
    setActionLoading(userId);
    await supabase.from("profiles").update({ aprovado: true } as any).eq("user_id", userId);
    toast.success("Usuária aprovada!");
    await loadData();
    setActionLoading(null);
  };

  const rejectUser = async (userId: string) => {
    setActionLoading(userId);
    await supabase.from("profiles").update({ aprovado: false } as any).eq("user_id", userId);
    toast.info("Aprovação revogada");
    await loadData();
    setActionLoading(null);
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta usuária?")) return;
    setActionLoading(userId);
    const { error } = await supabase.functions.invoke("admin-delete-user", { body: { user_id: userId } });
    if (error) toast.error("Erro ao excluir usuária");
    else toast.success("Usuária excluída");
    await loadData();
    setActionLoading(null);
  };

  const openEditUser = (u: any) => {
    setEditingUser(u);
    setEditForm({ nome: u.nome || "", email: u.email || "", telefone: u.telefone || "", cidade: u.cidade || "", estado: u.estado || "" });
  };

  const saveEditUser = async () => {
    if (!editingUser) return;
    setActionLoading(editingUser.user_id);
    await supabase.from("profiles").update({
      nome: editForm.nome, email: editForm.email, telefone: editForm.telefone,
      cidade: editForm.cidade, estado: editForm.estado,
    } as any).eq("user_id", editingUser.user_id);
    toast.success("Perfil atualizado");
    setEditingUser(null);
    await loadData();
    setActionLoading(null);
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

  const validateStripeKey = async () => {
    if (!stripeKey.startsWith("sk_")) { toast.error("A chave deve começar com sk_"); return; }
    setStripeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-stripe-key", { body: { stripe_key: stripeKey } });
      if (error) throw error;
      if (data?.success) { toast.success("Chave Stripe validada!"); setStripeKey(""); }
      else toast.error(data?.error || "Erro ao validar chave");
    } catch { toast.error("Erro ao validar chave Stripe"); }
    setStripeLoading(false);
  };

  const formatDate = (d: string) => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  const statCards = [
    { label: "Total Usuárias", value: stats.usuarios, icon: Users, trend: "+12%", color: "bg-primary/10 text-primary" },
    { label: "Alertas Ativos", value: stats.alertasAtivos, icon: Bell, trend: stats.alertasAtivos > 0 ? `~${stats.alertasAtivos}` : "0", color: "bg-destructive/10 text-destructive" },
    { label: "Total Alertas", value: stats.totalAlertas, icon: Activity, trend: `~${Math.round(stats.totalAlertas * 0.02)}%`, color: "bg-accent text-accent-foreground" },
    { label: "Incidentes Resolvidos", value: stats.incidentes, icon: CheckCircle2, trend: `~8%`, color: "bg-primary/10 text-primary" },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen flex flex-col bg-sidebar text-sidebar-foreground flex-shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(270 80% 60%), hsl(250 80% 55%))" }}>
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Valkyra</p>
            <p className="text-[11px] text-sidebar-foreground/60">O Escudo Delas</p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-2">
          {sidebarTabs.map((t) => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50"
                }`}
              >
                <t.icon size={18} />
                <span>{t.label}</span>
                {t.key === "alertas" && stats.alertasAtivos > 0 && (
                  <span className="ml-auto bg-destructive text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {stats.alertasAtivos}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent/50 transition-colors">
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              {sidebarTabs.find(t => t.key === tab)?.label || "Admin Dashboard"}
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder="Pesquisar..."
                  className="pl-9 pr-4 py-2 rounded-lg bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-64"
                />
              </div>
              <button className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                <Bell size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Dashboard */}
              {tab === "dashboard" && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
                    <p className="text-sm text-muted-foreground mt-1">Monitoramento em tempo real e análise de segurança.</p>
                  </div>

                  {/* Stat Cards */}
                  <div className="grid grid-cols-4 gap-4">
                    {statCards.map((s) => (
                      <div key={s.label} className="p-5 rounded-2xl bg-card shadow-card border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                            <s.icon size={20} />
                          </div>
                          <span className="text-xs font-medium text-primary flex items-center gap-1">
                            <TrendingUp size={12} /> {s.trend}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                        <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{s.value.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent Activity + Map placeholder */}
                  <div className="grid grid-cols-5 gap-4">
                    <div className="col-span-3 rounded-2xl bg-card shadow-card border border-border p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-foreground">Atividade Recente</h3>
                        <button className="text-xs text-primary font-semibold">Ver Tudo</button>
                      </div>
                      <div className="space-y-3">
                        {alertas.slice(0, 4).map((a: any) => (
                          <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              a.status === "ativo" ? "bg-destructive/10" : "bg-primary/10"
                            }`}>
                              {a.status === "ativo" ? (
                                <AlertTriangle size={16} className="text-destructive" />
                              ) : (
                                <CheckCircle2 size={16} className="text-primary" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">
                                {a.status === "ativo" ? "Alerta SOS Acionado" : "Alerta Resolvido"}
                              </p>
                              <p className="text-xs text-muted-foreground">{a.tipo_alerta}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[11px] text-muted-foreground">{formatDate(a.created_at)}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                a.status === "ativo"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {a.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))}
                        {alertas.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum alerta registrado</p>}
                      </div>
                    </div>

                    <div className="col-span-2 rounded-2xl bg-card shadow-card border border-border p-5">
                      <h3 className="font-bold text-foreground mb-3">Mapa de Alertas Ativos</h3>
                      <div className="h-64 rounded-xl bg-muted flex items-center justify-center">
                        <div className="text-center">
                          <MapPin size={32} className="mx-auto text-muted-foreground/40 mb-2" />
                          <p className="text-xs text-muted-foreground">Mapa em breve</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* API Status */}
                  <div className="rounded-2xl bg-card shadow-card border border-border p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-foreground">Status de Conectividade API</h3>
                      <div className="flex gap-2">
                        <button onClick={loadData} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-sm font-medium text-foreground hover:bg-muted/80">
                          <RefreshCw size={14} /> Refresh
                        </button>
                        <button onClick={() => setTab("apis")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                          Gerenciar APIs
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">Acesse a aba APIs para gerenciar chaves e status.</div>
                  </div>
                </div>
              )}

              {/* Users */}
              {tab === "usuarios" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">Usuárias</h1>
                      <p className="text-sm text-muted-foreground mt-1">{usuarios.length} usuária(s) cadastrada(s)</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-card shadow-card border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Usuária</th>
                          <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Localização</th>
                          <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cadastro</th>
                          <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usuarios.map((u: any) => (
                          <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden text-xs font-bold text-primary">
                                  {u.foto_url ? <img src={u.foto_url} className="w-full h-full object-cover" /> : (u.nome || "?")[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{u.nome || "Sem nome"}</p>
                                  <p className="text-xs text-muted-foreground">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex w-fit text-[10px] px-2 py-0.5 rounded-full font-medium ${(u as any).aprovado ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                                  {(u as any).aprovado ? "Aprovada" : "Pendente"}
                                </span>
                                <span className={`inline-flex w-fit text-[10px] px-2 py-0.5 rounded-full font-medium ${u.cadastro_completo ? "bg-accent text-accent-foreground" : "bg-caution/10 text-caution"}`}>
                                  {u.cadastro_completo ? "Completo" : "Incompleto"}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-muted-foreground">{u.cidade ? `${u.cidade}/${u.estado}` : "—"}</td>
                            <td className="px-5 py-4 text-muted-foreground">{formatDate(u.created_at)}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-1">
                                {!(u as any).aprovado ? (
                                  <button onClick={() => approveUser(u.user_id)} disabled={actionLoading === u.user_id}
                                    className="p-1.5 rounded-lg text-primary hover:bg-primary/10 disabled:opacity-50"><CheckCircle2 size={16} /></button>
                                ) : (
                                  <button onClick={() => rejectUser(u.user_id)} disabled={actionLoading === u.user_id}
                                    className="p-1.5 rounded-lg text-caution hover:bg-caution/10 disabled:opacity-50"><XCircle size={16} /></button>
                                )}
                                <button onClick={() => openEditUser(u)} disabled={actionLoading === u.user_id}
                                  className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50"><Edit3 size={16} /></button>
                                <button onClick={() => deleteUser(u.user_id)} disabled={actionLoading === u.user_id}
                                  className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 disabled:opacity-50"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Alerts */}
              {tab === "alertas" && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
                  <p className="text-sm text-muted-foreground">{alertas.length} alerta(s)</p>
                  <div className="rounded-2xl bg-card shadow-card border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
                          <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Localização</th>
                          <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                          <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alertas.map((a: any) => (
                          <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                            <td className="px-5 py-4">
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                a.status === "ativo" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                              }`}>{a.status.toUpperCase()}</span>
                            </td>
                            <td className="px-5 py-4 text-foreground">{a.tipo_alerta}</td>
                            <td className="px-5 py-4 text-muted-foreground">
                              {a.latitude ? `${a.latitude.toFixed(4)}, ${a.longitude.toFixed(4)}` : "—"}
                            </td>
                            <td className="px-5 py-4 text-muted-foreground">{formatDate(a.created_at)}</td>
                            <td className="px-5 py-4 text-right">
                              {a.status === "ativo" && (
                                <button onClick={() => cancelAlert(a.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10">
                                  <Ban size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Incidents */}
              {tab === "incidentes" && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-foreground">Incidentes</h1>
                  <p className="text-sm text-muted-foreground">{incidentes.length} incidente(s)</p>
                  <div className="rounded-2xl bg-card shadow-card border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tipo</th>
                          <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Descrição</th>
                          <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Localização</th>
                          <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                          <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incidentes.map((i: any) => (
                          <tr key={i.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                            <td className="px-5 py-4 font-medium text-foreground">{i.tipo}</td>
                            <td className="px-5 py-4 text-muted-foreground max-w-xs truncate">{i.descricao || "—"}</td>
                            <td className="px-5 py-4 text-muted-foreground">{i.latitude.toFixed(4)}, {i.longitude.toFixed(4)}</td>
                            <td className="px-5 py-4 text-muted-foreground">{formatDate(i.created_at)}</td>
                            <td className="px-5 py-4 text-right">
                              <button onClick={() => deleteIncident(i.id)} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === "planos" && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-foreground">Planos de Assinatura</h1>
                  <PlanosTab />
                </div>
              )}

              {tab === "apis" && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold text-foreground">Gerenciar APIs</h1>
                  <ApiKeysTab />
                </div>
              )}

              {tab === "config" && (
                <div className="space-y-6 max-w-xl">
                  <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
                  <div className="p-6 rounded-2xl bg-card shadow-card border border-border space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Key size={20} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">Chave API Stripe</h3>
                        <p className="text-xs text-muted-foreground">Valide e salve sua chave secreta do Stripe</p>
                      </div>
                    </div>
                    <input
                      type="password"
                      value={stripeKey}
                      onChange={(e) => setStripeKey(e.target.value)}
                      placeholder="sk_live_... ou sk_test_..."
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      onClick={validateStripeKey}
                      disabled={stripeLoading || !stripeKey}
                      className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Key size={16} />
                      {stripeLoading ? "Validando..." : "Validar e Salvar Chave"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setEditingUser(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-2xl p-6 space-y-4 shadow-elevated border border-border"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Editar Usuária</h2>
                <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted">
                  <X size={20} />
                </button>
              </div>
              {[
                { key: "nome", label: "Nome", type: "text" },
                { key: "email", label: "Email", type: "email" },
                { key: "telefone", label: "Telefone", type: "tel" },
                { key: "cidade", label: "Cidade", type: "text" },
                { key: "estado", label: "Estado", type: "text" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{field.label}</label>
                  <input
                    type={field.type}
                    value={(editForm as any)[field.key]}
                    onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
              <button
                onClick={saveEditUser}
                disabled={actionLoading === editingUser?.user_id}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={16} /> Salvar Alterações
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;
