import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, ToggleLeft, ToggleRight, Save, X, Key, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  nome: string;
  servico: string;
  chave: string;
  ativo: boolean;
  created_at: string;
}

const SERVICOS = [
  { value: "google_maps", label: "Google Maps" },
  { value: "whatsapp", label: "WhatsApp API" },
  { value: "twilio", label: "Twilio" },
  { value: "stripe", label: "Stripe" },
  { value: "outro", label: "Outro" },
];

const ApiKeysTab = () => {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", servico: "google_maps", chave: "" });
  const [saving, setSaving] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  useEffect(() => { loadKeys(); }, []);

  const loadKeys = async () => {
    setLoading(true);
    const { data } = await supabase.from("api_keys").select("*").order("created_at", { ascending: false }) as any;
    setKeys(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ nome: "", servico: "google_maps", chave: "" });
    setShowForm(false);
  };

  const handleAdd = async () => {
    if (!form.nome || !form.chave) {
      toast.error("Preencha nome e chave");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("api_keys").insert({
      nome: form.nome,
      servico: form.servico,
      chave: form.chave,
    } as any);
    if (error) {
      toast.error("Erro ao salvar API key");
    } else {
      toast.success("API key adicionada!");
      resetForm();
      await loadKeys();
    }
    setSaving(false);
  };

  const toggleKey = async (k: ApiKey) => {
    const { error } = await supabase.from("api_keys").update({ ativo: !k.ativo } as any).eq("id", k.id);
    if (error) {
      toast.error("Erro ao alterar status");
    } else {
      toast.success(k.ativo ? "API key desativada" : "API key ativada");
      await loadKeys();
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Excluir esta API key?")) return;
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
    } else {
      toast.success("API key excluída");
      await loadKeys();
    }
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const maskKey = (key: string) => key.slice(0, 6) + "•".repeat(Math.max(0, key.length - 10)) + key.slice(-4);

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{keys.length} API key(s)</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium"
        >
          <Plus size={14} /> Nova API Key
        </motion.button>
      </div>

      {showForm && (
        <div className="p-4 rounded-2xl bg-card shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display text-foreground">Nova API Key</h3>
            <button onClick={resetForm} className="p-1 text-muted-foreground"><X size={16} /></button>
          </div>
          <input
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Nome identificador"
            className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary"
          />
          <select
            value={form.servico}
            onChange={(e) => setForm({ ...form, servico: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary"
          >
            {SERVICOS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <input
            type="password"
            value={form.chave}
            onChange={(e) => setForm({ ...form, chave: e.target.value })}
            placeholder="Chave da API"
            className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={16} /> {saving ? "Salvando..." : "Salvar API Key"}
          </motion.button>
        </div>
      )}

      {keys.map((k) => (
        <div key={k.id} className="p-4 rounded-2xl bg-card shadow-card space-y-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.ativo ? "bg-primary/10" : "bg-muted"}`}>
              <Key size={18} className={k.ativo ? "text-primary" : "text-muted-foreground"} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{k.nome}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${k.ativo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {k.ativo ? "Ativa" : "Inativa"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{SERVICOS.find((s) => s.value === k.servico)?.label || k.servico}</p>
              <div className="flex items-center gap-1 mt-1">
                <code className="text-[11px] bg-muted px-2 py-0.5 rounded text-muted-foreground font-mono">
                  {visibleKeys.has(k.id) ? k.chave : maskKey(k.chave)}
                </code>
                <button onClick={() => toggleVisibility(k.id)} className="p-0.5 text-muted-foreground hover:text-foreground">
                  {visibleKeys.has(k.id) ? <EyeOff size={12} /> : <Eye size={12} />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-border">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleKey(k)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium"
            >
              {k.ativo ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
              {k.ativo ? "Desativar" : "Ativar"}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => deleteKey(k.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-xs font-medium ml-auto"
            >
              <Trash2 size={13} /> Excluir
            </motion.button>
          </div>
        </div>
      ))}

      {keys.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground text-center py-8">Nenhuma API key cadastrada.</p>
      )}
    </div>
  );
};

export default ApiKeysTab;
