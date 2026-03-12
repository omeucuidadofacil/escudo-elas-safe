import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit3, Trash2, ToggleLeft, ToggleRight, Save, X, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Plano {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  intervalo: string;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  ativo: boolean;
  created_at: string;
}

const PlanosTab = () => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", preco: "", intervalo: "month" });

  useEffect(() => { loadPlanos(); }, []);

  const loadPlanos = async () => {
    setLoading(true);
    const { data } = await supabase.from("planos").select("*").order("created_at", { ascending: false }) as any;
    setPlanos(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ nome: "", descricao: "", preco: "", intervalo: "month" });
    setShowForm(false);
    setEditingId(null);
  };

  const openEdit = (p: Plano) => {
    setEditingId(p.id);
    setForm({ nome: p.nome, descricao: p.descricao || "", preco: String(p.preco), intervalo: p.intervalo });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.nome || !form.preco) {
      toast.error("Preencha nome e preço");
      return;
    }
    setActionLoading("form");
    try {
      const action = editingId ? "update" : "create";
      const body: any = {
        action,
        nome: form.nome,
        descricao: form.descricao,
        preco: parseFloat(form.preco),
        intervalo: form.intervalo,
      };
      if (editingId) body.id = editingId;

      const { data, error } = await supabase.functions.invoke("manage-plans", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(editingId ? "Plano atualizado!" : "Plano criado!");
      resetForm();
      await loadPlanos();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar plano");
    }
    setActionLoading(null);
  };

  const togglePlano = async (id: string) => {
    setActionLoading(id);
    try {
      const { data, error } = await supabase.functions.invoke("manage-plans", {
        body: { action: "toggle", id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(data.ativo ? "Plano ativado" : "Plano desativado");
      await loadPlanos();
    } catch (err: any) {
      toast.error("Erro ao alterar status");
    }
    setActionLoading(null);
  };

  const deletePlano = async (id: string) => {
    if (!confirm("Excluir este plano? A assinatura no Stripe será arquivada.")) return;
    setActionLoading(id);
    try {
      const { data, error } = await supabase.functions.invoke("manage-plans", {
        body: { action: "delete", id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Plano excluído");
      await loadPlanos();
    } catch (err: any) {
      toast.error("Erro ao excluir plano");
    }
    setActionLoading(null);
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{planos.length} plano(s)</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium"
        >
          <Plus size={14} /> Novo Plano
        </motion.button>
      </div>

      {showForm && (
        <div className="p-4 rounded-2xl bg-card shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display text-foreground">{editingId ? "Editar Plano" : "Novo Plano"}</h3>
            <button onClick={resetForm} className="p-1 text-muted-foreground"><X size={16} /></button>
          </div>
          <input
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Nome do plano"
            className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary"
          />
          <input
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Descrição (opcional)"
            className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary"
          />
          <div className="flex gap-3">
            <input
              type="number"
              step="0.01"
              value={form.preco}
              onChange={(e) => setForm({ ...form, preco: e.target.value })}
              placeholder="Preço (R$)"
              className="flex-1 px-4 py-3 rounded-xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary"
            />
            <select
              value={form.intervalo}
              onChange={(e) => setForm({ ...form, intervalo: e.target.value })}
              className="px-4 py-3 rounded-xl bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary"
            >
              <option value="month">Mensal</option>
              <option value="year">Anual</option>
            </select>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={actionLoading === "form"}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={16} /> {actionLoading === "form" ? "Salvando..." : "Salvar Plano"}
          </motion.button>
        </div>
      )}

      {planos.map((p) => (
        <div key={p.id} className="p-4 rounded-2xl bg-card shadow-card space-y-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.ativo ? "bg-primary/10" : "bg-muted"}`}>
              <CreditCard size={18} className={p.ativo ? "text-primary" : "text-muted-foreground"} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{p.nome}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.ativo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {p.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                R$ {Number(p.preco).toFixed(2)} / {p.intervalo === "year" ? "ano" : "mês"}
              </p>
              {p.descricao && <p className="text-xs text-muted-foreground truncate">{p.descricao}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-border">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => togglePlano(p.id)}
              disabled={actionLoading === p.id}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium disabled:opacity-50"
            >
              {p.ativo ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
              {p.ativo ? "Desativar" : "Ativar"}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => openEdit(p)}
              disabled={actionLoading === p.id}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium disabled:opacity-50"
            >
              <Edit3 size={13} /> Editar
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => deletePlano(p.id)}
              disabled={actionLoading === p.id}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium disabled:opacity-50 ml-auto"
            >
              <Trash2 size={13} /> Excluir
            </motion.button>
          </div>
        </div>
      ))}

      {planos.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground text-center py-8">Nenhum plano cadastrado. Clique em "Novo Plano" para começar.</p>
      )}
    </div>
  );
};

export default PlanosTab;
