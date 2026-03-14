import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  cadastroCompleto: boolean;
  profileLoading: boolean;
  subscribed: boolean;
  subscriptionLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isAdmin: false,
  cadastroCompleto: false,
  profileLoading: true,
  subscribed: false,
  subscriptionLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

const ADMIN_EMAIL = "ramos660@hotmail.com";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cadastroCompleto, setCadastroCompleto] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  const checkSubscription = async () => {
    setSubscriptionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data) {
        setSubscribed(data.subscribed === true);
      } else {
        setSubscribed(false);
      }
    } catch {
      setSubscribed(false);
    }
    setSubscriptionLoading(false);
  };

  const checkProfile = async (userId: string) => {
    setProfileLoading(true);
    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!roleData);

    // Check cadastro completo
    const { data: profile } = await supabase
      .from("profiles")
      .select("cadastro_completo")
      .eq("user_id", userId)
      .maybeSingle();
    setCadastroCompleto(profile?.cadastro_completo ?? false);
    setProfileLoading(false);
  };

  const refreshProfile = async () => {
    if (session?.user) await checkProfile(session.user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
        if (session?.user) {
          // Check if user email is admin and auto-assign role
        if (session.user.email === ADMIN_EMAIL) {
            supabase.from("user_roles").upsert({
              user_id: session.user.id,
              role: "admin" as any,
            }, { onConflict: "user_id,role" }).then(() => {
              checkProfile(session.user.id);
            });
          } else {
            checkProfile(session.user.id);
          }
          checkSubscription();
        } else {
          setIsAdmin(false);
          setCadastroCompleto(false);
          setProfileLoading(false);
          setSubscribed(false);
          setSubscriptionLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        if (session.user.email === ADMIN_EMAIL) {
          supabase.from("user_roles").upsert({
            user_id: session.user.id,
            role: "admin" as any,
          }, { onConflict: "user_id,role" }).then(() => {
            checkProfile(session.user.id);
          });
        } else {
          checkProfile(session.user.id);
        }
        checkSubscription();
      } else {
        setProfileLoading(false);
        setSubscriptionLoading(false);
      }
    });

    // Re-check subscription every 60s
    const interval = setInterval(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) checkSubscription();
      });
    }, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setCadastroCompleto(false);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, isAdmin, cadastroCompleto, profileLoading, subscribed, subscriptionLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
