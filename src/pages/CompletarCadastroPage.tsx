import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, User, MapPin, Camera, UserPlus, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PaymentPopup from "@/components/PaymentPopup";

const ESTADOS_BR = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA",
  "PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"
];

const CompletarCadastroPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const [dados, setDados] = useState({
    nome: "",
    cpf: "",
    telefone_celular: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  const [contato, setContato] = useState({ nome: "", telefone: "", relacao: "" });

  const updateDados = (field: string, value: string) => {
    setDados((prev) => ({ ...prev, [field]: value }));
  };

  const formatCPF = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 11);
    return n.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 11);
    if (n.length <= 2) return `(${n}`;
    if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  };

  const formatCEP = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 8);
    if (n.length <= 5) return n;
    return `${n.slice(0, 5)}-${n.slice(5)}`;
  };

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setFotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const buscarCEP = async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setDados((prev) => ({
          ...prev,
          rua: data.logradouro || prev.rua,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }));
      }
    } catch {}
  };

  const canAdvance = () => {
    switch (step) {
      case 0:
        return dados.nome.trim().length >= 3 && dados.cpf.replace(/\D/g, "").length === 11 && dados.telefone_celular.replace(/\D/g, "").length >= 10;
      case 1:
        return dados.cep.replace(/\D/g, "").length === 8 && dados.rua.trim() && dados.numero.trim() && dados.bairro.trim() && dados.cidade.trim() && dados.estado.trim();
      case 2:
        return true; // foto optional
      case 3:
        return contato.nome.trim() && contato.telefone.replace(/\D/g, "").length >= 10 && contato.relacao.trim();
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let foto_url = "";
      if (fotoFile) {
        const ext = fotoFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(path, fotoFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
          foto_url = urlData.publicUrl;
        }
      }

      const { error: profileError } = await supabase.from("profiles").update({
        nome: dados.nome,
        cpf: dados.cpf,
        telefone_celular: dados.telefone_celular,
        telefone: dados.telefone_celular,
        cep: dados.cep,
        rua: dados.rua,
        numero: dados.numero,
        complemento: dados.complemento,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado,
        foto_url: foto_url || undefined,
        cadastro_completo: true,
      }).eq("user_id", user.id);

      if (profileError) throw profileError;

      const { error: contactError } = await supabase.from("contatos_emergencia").insert({
        user_id: user.id,
        nome: contato.nome,
        telefone: contato.telefone,
        relacao: contato.relacao,
      });

      if (contactError) throw contactError;

      toast.success("Cadastro completo! Bem-vinda ao Valkyra.");
      setShowPayment(true);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || "Tente novamente"));
    }
    setLoading(false);
  };

  const steps = [
    {
      title: "Dados Pessoais",
      icon: User,
      content: (
        <div className="space-y-4">
          <InputField label="Nome completo" value={dados.nome} onChange={(v) => updateDados("nome", v)} placeholder="Seu nome completo" />
          <InputField label="CPF" value={dados.cpf} onChange={(v) => updateDados("cpf", formatCPF(v))} placeholder="000.000.000-00" inputMode="numeric" />
          <InputField label="Celular" value={dados.telefone_celular} onChange={(v) => updateDados("telefone_celular", formatPhone(v))} placeholder="(00) 00000-0000" type="tel" inputMode="tel" />
        </div>
      ),
    },
    {
      title: "Endereço",
      icon: MapPin,
      content: (
        <div className="space-y-4">
          <InputField label="CEP" value={dados.cep} onChange={(v) => { updateDados("cep", formatCEP(v)); if (v.replace(/\D/g, "").length === 8) buscarCEP(v); }} placeholder="00000-000" inputMode="numeric" />
          <InputField label="Rua" value={dados.rua} onChange={(v) => updateDados("rua", v)} placeholder="Nome da rua" />
          <div className="grid grid-cols-3 gap-3">
            <InputField label="Número" value={dados.numero} onChange={(v) => updateDados("numero", v)} placeholder="Nº" />
            <div className="col-span-2">
              <InputField label="Complemento" value={dados.complemento} onChange={(v) => updateDados("complemento", v)} placeholder="Apto, bloco..." />
            </div>
          </div>
          <InputField label="Bairro" value={dados.bairro} onChange={(v) => updateDados("bairro", v)} placeholder="Bairro" />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Cidade" value={dados.cidade} onChange={(v) => updateDados("cidade", v)} placeholder="Cidade" />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Estado</label>
              <select
                value={dados.estado}
                onChange={(e) => updateDados("estado", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-card border border-input text-sm text-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary"
              >
                <option value="">UF</option>
                {ESTADOS_BR.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Foto de Perfil",
      icon: Camera,
      content: (
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera size={32} className="text-muted-foreground" />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-elevated">
              <Camera size={18} className="text-primary-foreground" />
              <input type="file" accept="image/*" className="hidden" onChange={handleFoto} />
            </label>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {fotoPreview ? "Foto selecionada! Você pode trocar clicando no ícone." : "Adicione uma foto para seu perfil (opcional)"}
          </p>
        </div>
      ),
    },
    {
      title: "Contato de Emergência",
      icon: UserPlus,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Adicione pelo menos 1 contato de emergência. Essa pessoa será notificada quando você ativar o SOS.</p>
          <InputField label="Nome do contato" value={contato.nome} onChange={(v) => setContato({ ...contato, nome: v })} placeholder="Nome completo" />
          <InputField label="Telefone" value={contato.telefone} onChange={(v) => setContato({ ...contato, telefone: formatPhone(v) })} placeholder="(00) 00000-0000" type="tel" inputMode="tel" />
          <InputField label="Relação" value={contato.relacao} onChange={(v) => setContato({ ...contato, relacao: v })} placeholder="Ex: Mãe, Irmã, Amiga" />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-svh flex flex-col bg-background">
      {/* Progress */}
      <header className="px-5 pt-[env(safe-area-inset-top)] mt-4">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-primary" />
          <span className="font-display text-foreground">Completar Cadastro</span>
        </div>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Passo {step + 1} de {steps.length}</p>
      </header>

      {/* Step content */}
      <div className="flex-1 px-5 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-6">
              {(() => { const Icon = steps[step].icon; return <Icon size={20} className="text-primary" />; })()}
              <h2 className="text-lg font-display text-foreground">{steps[step].title}</h2>
            </div>
            {steps[step].content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="px-5 pb-8 flex gap-3">
        {step > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setStep(step - 1)}
            className="px-6 py-4 rounded-xl bg-muted text-muted-foreground font-medium text-sm flex items-center gap-2"
          >
            <ChevronLeft size={16} />
            Voltar
          </motion.button>
        )}
        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={!canAdvance() || loading}
          onClick={() => {
            if (step < steps.length - 1) setStep(step + 1);
            else handleSubmit();
          }}
          className={`flex-1 py-4 rounded-xl font-display text-base flex items-center justify-center gap-2 transition-colors ${
            canAdvance() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          } disabled:opacity-50`}
        >
          {loading ? "Salvando..." : step < steps.length - 1 ? (
            <>Próximo <ChevronRight size={16} /></>
          ) : (
            <>Finalizar <Check size={16} /></>
          )}
        </motion.button>
      </div>
      <PaymentPopup open={showPayment} onClose={() => { setShowPayment(false); navigate("/"); }} />
    </div>
  );
};

const InputField = ({ label, value, onChange, placeholder, type = "text", inputMode }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; inputMode?: string;
}) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    <input
      type={type}
      inputMode={inputMode as any}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl bg-card border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary"
    />
  </div>
);

export default CompletarCadastroPage;
