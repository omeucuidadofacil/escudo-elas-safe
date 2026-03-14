import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Phone, Trash2, ChevronRight, Bell, Lock, HelpCircle, User, LogOut, Shield, Siren, Ambulance, Flame, ShieldCheck, PhoneCall } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Contact {
  id: string;
  nome: string;
  telefone: string;
  relacao: string;
  telegram_chat_id: string;
}

const ConfigPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ nome: "", telefone: "", relacao: "", telegram_chat_id: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchContacts = async () => {
      const { data, error } = await supabase
        .from("contatos_emergencia")
        .select("id, nome, telefone, relacao, telegram_chat_id")
        .order("created_at", { ascending: true });
      if (!error && data) setContacts(data);
      setLoading(false);
    };
    fetchContacts();
  }, [user]);

  const addContact = async () => {
    if (!newContact.nome.trim() || !newContact.telefone.trim()) return;
    if (contacts.length >= 5) return;

    const { data, error } = await supabase
      .from("contatos_emergencia")
      .insert({ ...newContact, user_id: user!.id })
      .select("id, nome, telefone, relacao, telegram_chat_id")
      .single();

    if (error) {
      toast.error("Erro ao adicionar contato");
      return;
    }
    setContacts([...contacts, data]);
    setNewContact({ nome: "", telefone: "", relacao: "", telegram_chat_id: "" });
    setShowAddForm(false);
    toast.success("Contato adicionado!");
  };

  const removeContact = async (id: string) => {
    const { error } = await supabase.from("contatos_emergencia").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover contato");
      return;
    }
    setContacts(contacts.filter((c) => c.id !== id));
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-svh flex flex-col pb-20 bg-background">
      <header className="px-5 pt-[env(safe-area-inset-top)] mt-4 mb-4">
        <h1 className="text-xl font-display">Configurações</h1>
      </header>

      <div className="flex-1 px-5 space-y-6">
        {/* Emergency Contacts */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-display">Contatos de Emergência</h2>
            <span className="text-xs text-muted-foreground">{contacts.length}/5</span>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {contacts.map((contact) => (
                  <motion.div
                    key={contact.id}
                    layout
                    className="flex items-center gap-3 p-4 rounded-2xl bg-card shadow-card"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{contact.nome}</p>
                      <p className="text-xs text-muted-foreground">{contact.telefone} · {contact.relacao}</p>
                    </div>
                    <button
                      onClick={() => removeContact(contact.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </motion.div>
                ))}

                {showAddForm ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-4 rounded-2xl bg-card shadow-card space-y-3"
                  >
                    <input
                      type="text"
                      placeholder="Nome"
                      value={newContact.nome}
                      onChange={(e) => setNewContact({ ...newContact, nome: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary"
                    />
                    <input
                      type="tel"
                      placeholder="Telefone"
                      value={newContact.telefone}
                      onChange={(e) => setNewContact({ ...newContact, telefone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Relação (ex: Mãe, Amiga)"
                      value={newContact.relacao}
                      onChange={(e) => setNewContact({ ...newContact, relacao: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Telegram Chat ID (envie /start ao @valkyra_sos_bot)"
                      value={newContact.telegram_chat_id}
                      onChange={(e) => setNewContact({ ...newContact, telegram_chat_id: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary"
                    />
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={addContact}
                        className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                      >
                        Salvar
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-3 rounded-xl bg-muted text-muted-foreground text-sm font-medium"
                      >
                        Cancelar
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  contacts.length < 5 && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center gap-3 w-full p-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground"
                    >
                      <UserPlus size={18} />
                      <span className="text-sm font-medium">Adicionar contato</span>
                    </motion.button>
                  )
                )}
              </>
            )}
          </div>
        </section>

        {/* Emergency Services */}
        <section>
          <h2 className="text-base font-display mb-3">Ligar para Emergência</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Delegacia da Mulher", number: "180", icon: Shield, color: "bg-primary/10 text-primary" },
              { label: "Polícia Militar", number: "190", icon: Siren, color: "bg-destructive/10 text-destructive" },
              { label: "SAMU", number: "192", icon: Ambulance, color: "bg-success/10 text-success" },
              { label: "Bombeiros", number: "193", icon: Flame, color: "bg-warning/10 text-warning" },
              { label: "Guarda Municipal", number: "153", icon: ShieldCheck, color: "bg-accent/10 text-accent-foreground" },
              { label: "Disque Denúncia", number: "181", icon: PhoneCall, color: "bg-caution/10 text-caution-foreground" },
            ].map((service, i) => (
              <motion.a
                key={i}
                href={`tel:${service.number}`}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                  if (!isMobile) {
                    e.preventDefault();
                    toast.info(`Ligue para ${service.label}: ${service.number}`, {
                      description: "Disque este número no seu telefone.",
                      duration: 5000,
                    });
                  }
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card shadow-card text-center"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${service.color}`}>
                  <service.icon size={22} />
                </div>
                <span className="text-xs font-medium text-foreground leading-tight">{service.label}</span>
                <span className="text-lg font-bold text-primary">{service.number}</span>
              </motion.a>
            ))}
          </div>
        </section>

        {/* Settings menu */}
        <section className="space-y-1">
          {[
            { icon: Bell, label: "Notificações" },
            { icon: Lock, label: "Privacidade e Segurança" },
            { icon: Phone, label: "Ativação Silenciosa" },
            { icon: HelpCircle, label: "Como usar o app", action: () => navigate("/ajuda") },
          ].map((item, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.98 }}
              onClick={item.action}
              className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-muted/50 transition-colors touch-target"
            >
              <item.icon size={20} className="text-muted-foreground" />
              <span className="flex-1 text-left text-sm font-medium text-foreground">{item.label}</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </motion.button>
          ))}
        </section>

        {/* Logout */}
        <section>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={20} className="text-destructive" />
            <span className="text-sm font-medium text-destructive">Sair da conta</span>
          </motion.button>
        </section>
      </div>
    </div>
  );
};

export default ConfigPage;
