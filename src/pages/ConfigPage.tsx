import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Phone, Trash2, ChevronRight, Bell, Lock, HelpCircle, User } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

const ConfigPage = () => {
  const [contacts, setContacts] = useState<Contact[]>([
    { id: "1", name: "Maria Silva", phone: "(11) 99999-1234", relation: "Mãe" },
    { id: "2", name: "Ana Costa", phone: "(11) 98888-5678", relation: "Amiga" },
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", relation: "" });

  const addContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) return;
    if (contacts.length >= 5) return;
    setContacts([...contacts, { id: Date.now().toString(), ...newContact }]);
    setNewContact({ name: "", phone: "", relation: "" });
    setShowAddForm(false);
  };

  const removeContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
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
                  <p className="text-sm font-medium text-foreground">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">{contact.phone} · {contact.relation}</p>
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
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary"
                />
                <input
                  type="tel"
                  placeholder="Telefone"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="Relação (ex: Mãe, Amiga)"
                  value={newContact.relation}
                  onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
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
          </div>
        </section>

        {/* Settings menu */}
        <section className="space-y-1">
          {[
            { icon: Bell, label: "Notificações" },
            { icon: Lock, label: "Privacidade e Segurança" },
            { icon: Phone, label: "Ativação Silenciosa" },
            { icon: HelpCircle, label: "Ajuda" },
          ].map((item, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-muted/50 transition-colors touch-target"
            >
              <item.icon size={20} className="text-muted-foreground" />
              <span className="flex-1 text-left text-sm font-medium text-foreground">{item.label}</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </motion.button>
          ))}
        </section>
      </div>
    </div>
  );
};

export default ConfigPage;
