import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthGuard";

export interface OnboardingStatus {
  loading: boolean;
  completed: boolean | null;
  storeId: string | null;
  step: number;
  language: "en" | "bn";
}

export function useOnboardingStatus(): OnboardingStatus {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<OnboardingStatus>({
    loading: true,
    completed: null,
    storeId: null,
    step: 0,
    language: "en",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    (async () => {
      const { data } = await supabase
        .from("stores")
        .select("id, onboarding_completed, onboarding_step, preferred_language")
        .eq("user_id", user.id)
        .maybeSingle();

      setState({
        loading: false,
        completed: data ? Boolean((data as any).onboarding_completed) : false,
        storeId: data?.id ?? null,
        step: data ? Number((data as any).onboarding_step ?? 0) : 0,
        language: (data?.preferred_language as "en" | "bn") ?? "en",
      });
    })();
  }, [user, authLoading]);

  return state;
}
