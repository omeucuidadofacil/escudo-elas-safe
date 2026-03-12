import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import SOSPage from "@/pages/SOSPage";
import MapaPage from "@/pages/MapaPage";
import TrajetoPage from "@/pages/TrajetoPage";
import ConfigPage from "@/pages/ConfigPage";
import OnboardingPage from "@/pages/OnboardingPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <div className="max-w-md mx-auto relative">
          <Routes>
            <Route path="/" element={<SOSPage />} />
            <Route path="/mapa" element={<MapaPage />} />
            <Route path="/trajeto" element={<TrajetoPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
