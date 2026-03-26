import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import valkyraLogo from "@/assets/valkyra-logo.png";

const Index = () => {
  const { user, cadastroCompleto } = useAuth();
  const navigate = useNavigate();

  const handleTap = () => {
    if (user && cadastroCompleto) {
      navigate("/sos");
    } else if (user) {
      navigate("/completar-cadastro");
    } else {
      navigate("/cadastro");
    }
  };

  return (
    <div className="min-h-svh flex flex-col items-center justify-center pb-20 bg-gradient-to-b from-[hsl(270,30%,95%)] to-background">
      {/* Pulsating logo button */}
      <motion.button
        onClick={handleTap}
        className="relative flex items-center justify-center mb-8 focus:outline-none"
        whileTap={{ scale: 0.95 }}
      >
        {/* Outer pulse rings */}
        <motion.div
          className="absolute w-52 h-52 rounded-full border border-primary/20"
          animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute w-52 h-52 rounded-full border border-primary/15"
          animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
        />
        <motion.div
          className="absolute w-52 h-52 rounded-full border border-primary/10"
          animate={{ scale: [1, 1.7], opacity: [0.2, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
        />

        {/* Glow behind */}
        <div className="absolute w-48 h-48 rounded-full bg-primary/15 blur-2xl" />

        {/* Dark circle with logo */}
        <motion.div
          className="relative w-44 h-44 rounded-full flex items-center justify-center overflow-hidden shadow-[0_0_40px_hsl(270,60%,55%,0.3)]"
          style={{
            background: "radial-gradient(circle at 40% 35%, hsl(260, 40%, 22%), hsl(250, 50%, 10%))",
          }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src={valkyraLogo}
            alt="Valkyra Logo"
            className="w-36 h-auto object-contain"
          />
        </motion.div>
      </motion.button>

      {/* Brand text */}
      <h1 className="text-3xl font-bold text-foreground tracking-tight">Valkyra</h1>
      <p className="text-sm text-muted-foreground mt-1.5">
        Escudo Delas — Sua segurança em primeiro lugar
      </p>

      {/* CTA */}
      <motion.p
        className="mt-6 text-sm font-semibold text-primary cursor-pointer"
        onClick={handleTap}
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        Toque para começar
      </motion.p>
    </div>
  );
};

export default Index;
