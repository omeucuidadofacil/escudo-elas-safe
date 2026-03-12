import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    // Also check if already in recovery (hash params)
    if (window.location.hash.includes("type=recovery")) {
      setReady(true);
    }
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha redefinida com sucesso!");
      navigate("/login");
    }
    setLoading(false);
  };

  if (!ready) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center bg-background px-6">
        <p className="text-muted-foreground">Verificando link de recuperação...</p>
      </div>
    );
  }

  return (
    <div className="min-h-svh flex flex-col bg-background px-6">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-3">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display text-foreground">Nova senha</h1>
          <p className="text-sm text-muted-foreground mt-1">Digite sua nova senha</p>
        </motion.div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type={showPassword ? "text" : "password"} placeholder="Nova senha" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-12 py-4 rounded-xl bg-card border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type={showPassword ? "text" : "password"} placeholder="Confirmar nova senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-4 rounded-xl bg-card border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-[3px] focus:ring-ring focus:border-primary" required />
          </div>
          <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-display text-base disabled:opacity-50">
            {loading ? "Salvando..." : "Redefinir senha"}
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
