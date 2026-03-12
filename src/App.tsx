import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import SOSPage from "@/pages/SOSPage";
import MapaPage from "@/pages/MapaPage";
import TrajetoPage from "@/pages/TrajetoPage";
import ConfigPage from "@/pages/ConfigPage";
import OnboardingPage from "@/pages/OnboardingPage";
import LoginPage from "@/pages/LoginPage";
import CadastroPage from "@/pages/CadastroPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-svh flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="max-w-md mx-auto relative">
            <Routes>
              <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path="/cadastro" element={<PublicRoute><CadastroPage /></PublicRoute>} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/" element={<ProtectedRoute><SOSPage /></ProtectedRoute>} />
              <Route path="/mapa" element={<ProtectedRoute><MapaPage /></ProtectedRoute>} />
              <Route path="/trajeto" element={<ProtectedRoute><TrajetoPage /></ProtectedRoute>} />
              <Route path="/config" element={<ProtectedRoute><ConfigPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
