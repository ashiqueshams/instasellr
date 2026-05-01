import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    // Check onboarding status — but only when actually entering the dashboard
    // (don't run this check while already on /onboarding)
    if (location.pathname.startsWith("/onboarding")) {
      setChecking(false);
      return;
    }

    (async () => {
      const { data } = await supabase
        .from("stores")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      // If no store yet, or onboarding not completed → send to wizard
      if (!data || !(data as any).onboarding_completed) {
        navigate("/onboarding", { replace: true });
        return;
      }
      setChecking(false);
    })();
  }, [user, loading, navigate, location.pathname]);

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
