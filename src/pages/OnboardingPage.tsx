import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, MapPin, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const slides = [
  {
    icon: Shield,
    title: "Sua segurança, conectada.",
    description: "Acione ajuda instantaneamente com o botão SOS e notifique seus contatos de confiança.",
  },
  {
    icon: MapPin,
    title: "Mapa de risco urbano",
    description: "Visualize e reporte incidentes na sua região. Informação é proteção.",
  },
  {
    icon: Users,
    title: "Rede de proteção",
    description: "Mulheres próximas são alertadas quando você precisa. Juntas somos mais fortes.",
  },
];

const OnboardingPage = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const next = () => {
    if (current < slides.length - 1) {
      setCurrent(current + 1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-svh flex flex-col bg-background px-6 pt-[env(safe-area-inset-top)]">
      {/* Skip */}
      <div className="flex justify-end pt-4">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground px-3 py-2"
        >
          Pular
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-8">
              {(() => {
                const Icon = slides[current].icon;
                return <Icon size={40} className="text-primary" />;
              })()}
            </div>
            <h1 className="text-2xl font-display text-foreground mb-3">
              {slides[current].title}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-xs">
              {slides[current].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom */}
      <div className="pb-10 space-y-6">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-primary" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.button
          onClick={next}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", duration: 0.2, bounce: 0 }}
          className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-display text-lg flex items-center justify-center gap-2"
        >
          {current < slides.length - 1 ? "Continuar" : "Começar"}
          <ArrowRight size={20} />
        </motion.button>
      </div>
    </div>
  );
};

export default OnboardingPage;
