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
import CompletarCadastroPage from "@/pages/CompletarCadastroPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import PainelPage from "@/pages/PainelPage";
import AdminPage from "@/pages/AdminPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const LoadingSpinner = () => (
  <div className="min-h-svh flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

/** Routes that require login + complete registration */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, cadastroCompleto, profileLoading, isAdmin } = useAuth();
  if (loading || profileLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/cadastro" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (!cadastroCompleto) return <Navigate to="/completar-cadastro" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, profileLoading, isAdmin, cadastroCompleto } = useAuth();
  if (loading || profileLoading) return <LoadingSpinner />;
  if (user) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (!cadastroCompleto) return <Navigate to="/completar-cadastro" replace />;
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const CadastroRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, cadastroCompleto, profileLoading, isAdmin } = useAuth();
  if (loading || profileLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (cadastroCompleto) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin, profileLoading } = useAuth();
  if (loading || profileLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
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
              <Route path="/completar-cadastro" element={<CadastroRoute><CompletarCadastroPage /></CadastroRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
              {/* SOS page is public — visible to everyone */}
              <Route path="/" element={<SOSPage />} />
              {/* These require login + cadastro completo */}
              <Route path="/mapa" element={<ProtectedRoute><MapaPage /></ProtectedRoute>} />
              <Route path="/trajeto" element={<ProtectedRoute><TrajetoPage /></ProtectedRoute>} />
              <Route path="/painel" element={<ProtectedRoute><PainelPage /></ProtectedRoute>} />
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
