import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Users, AlertTriangle, MapPin, BarChart3, Trash2, Ban, CheckCircle2, LogOut, XCircle, Edit3, X, Save, Key, CreditCard, Code } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import PlanosTab from "@/components/admin/PlanosTab";
import ApiKeysTab from "@/components/admin/ApiKeysTab";

type Tab = "dashboard" | "usuarios" | "alertas" | "incidentes" | "planos" | "apis" | "config";

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
    if (!confirm("Tem certeza que deseja excluir esta usuária? Esta ação não pode ser desfeita.")) return;
    setActionLoading(userId);
    const { data, error } = await supabase.functions.invoke("admin-delete-user", {
      body: { user_id: userId },
    });
    if (error) {
      toast.error("Erro ao excluir usuária");
    } else {
      toast.success("Usuária excluída");
    }
    await loadData();
    setActionLoading(null);
  };

  const openEditUser = (u: any) => {
    setEditingUser(u);
    setEditForm({
      nome: u.nome || "",
      email: u.email || "",
      telefone: u.telefone || "",
      cidade: u.cidade || "",
      estado: u.estado || "",
    });
  };

  const saveEditUser = async () => {
    if (!editingUser) return;
    setActionLoading(editingUser.user_id);
    await supabase.from("profiles").update({
      nome: editForm.nome,
      email: editForm.email,
      telefone: editForm.telefone,
      cidade: editForm.cidade,
      estado: editForm.estado,
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
    if (!stripeKey.startsWith("sk_")) {
      toast.error("A chave deve começar com sk_");
      return;
    }
    setStripeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-stripe-key", {
        body: { stripe_key: stripeKey },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Chave Stripe validada com sucesso!");
        setStripeKey("");
      } else {
        toast.error(data?.error || "Erro ao validar chave");
      }
    } catch (err: any) {
      toast.error("Erro ao validar chave Stripe");
    }
    setStripeLoading(false);
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "dashboard", label: "Dashboard", icon: BarChart3 },
    { key: "usuarios", label: "Usuárias", icon: Users },
    { key: "alertas", label: "Alertas", icon: AlertTriangle },
    { key: "incidentes", label: "Incidentes", icon: MapPin },
    { key: "planos", label: "Planos", icon: CreditCard },
    { key: "apis", label: "APIs", icon: Code },
    { key: "config", label: "Config", icon: Key },
  ];

  const formatDate = (d: string) => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="min-h-svh bg-background">
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
                  <div key={u.id} className="p-4 rounded-2xl bg-card shadow-card space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {u.foto_url ? <img src={u.foto_url} className="w-full h-full object-cover" /> : <Users size={18} className="text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.nome || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                        {u.telefone && <p className="text-xs text-muted-foreground">{u.telefone}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${u.cadastro_completo ? "bg-primary/10 text-primary" : "bg-caution/10 text-caution"}`}>
                          {u.cadastro_completo ? "Completo" : "Incompleto"}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${(u as any).aprovado ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                          {(u as any).aprovado ? "Aprovada" : "Pendente"}
                        </span>
                      </div>
                    </div>
                    {u.cidade && <p className="text-xs text-muted-foreground">{u.cidade}/{u.estado}</p>}
                    <p className="text-[10px] text-muted-foreground">Cadastro: {formatDate(u.created_at)}</p>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 border-t border-border">
                      {!(u as any).aprovado ? (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => approveUser(u.user_id)}
                          disabled={actionLoading === u.user_id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium disabled:opacity-50"
                        >
                          <CheckCircle2 size={13} /> Aprovar
                        </motion.button>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => rejectUser(u.user_id)}
                          disabled={actionLoading === u.user_id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-caution/10 text-caution text-xs font-medium disabled:opacity-50"
                        >
                          <XCircle size={13} /> Revogar
                        </motion.button>
                      )}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openEditUser(u)}
                        disabled={actionLoading === u.user_id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium disabled:opacity-50"
                      >
                        <Edit3 size={13} /> Editar
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => deleteUser(u.user_id)}
                        disabled={actionLoading === u.user_id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium disabled:opacity-50 ml-auto"
                      >
                        <Trash2 size={13} /> Excluir
                      </motion.button>
                    </div>
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

            {/* Config */}
            {tab === "config" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-card shadow-card space-y-4">
                  <div className="flex items-center gap-2">
                    <Key size={18} className="text-primary" />
                    <h3 className="text-sm font-display text-foreground">Chave API Stripe</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Insira sua chave secreta do Stripe (começa com <code className="bg-muted px-1 py-0.5 rounded text-[11px]">sk_</code>). Ela será validada antes de ser salva.
                  </p>
                  <input
                    type="password"
                    value={stripeKey}
                    onChange={(e) => setStripeKey(e.target.value)}
                    placeholder="sk_live_... ou sk_test_..."
                    className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary"
                  />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={validateStripeKey}
                    disabled={stripeLoading || !stripeKey}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Key size={16} />
                    {stripeLoading ? "Validando..." : "Validar e Salvar Chave"}
                  </motion.button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/40 flex items-end justify-center"
            onClick={() => setEditingUser(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", duration: 0.4, bounce: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-t-3xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-foreground">Editar Usuária</h2>
                <button onClick={() => setEditingUser(null)} className="p-1 rounded-lg text-muted-foreground">
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
                  <label className="text-xs text-muted-foreground mb-1 block">{field.label}</label>
                  <input
                    type={field.type}
                    value={(editForm as any)[field.key]}
                    onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary"
                  />
                </div>
              ))}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={saveEditUser}
                disabled={actionLoading === editingUser?.user_id}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={16} /> Salvar Alterações
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;
