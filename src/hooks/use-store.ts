import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthGuard";

interface StoreData {
  id: string;
  slug: string;
  name: string;
  bio: string;
  avatar_initials: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  layout: string;
  logo_url: string | null;
  banner_url: string | null;
  theme: string;
  background_color: string | null;
  banner_mode: string;
  card_style: string;
  social_position: string;
  footer_image_url: string | null;
  text_color: string | null;
  social_links_color: string | null;
  social_links: Record<string, string>;
}

export function useStore() {
  const { user } = useAuth();
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStore = async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
        .order("onboarding_completed", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setStore({
          id: data.id,
          slug: data.slug,
          name: data.name,
          bio: data.bio || "",
          avatar_initials: data.avatar_initials || "",
          accent_color: data.accent_color || "#ff4545",
          font_heading: data.font_heading || "Syne",
          font_body: data.font_body || "Manrope",
          layout: data.layout || "list",
          logo_url: data.logo_url || null,
          banner_url: data.banner_url || null,
          theme: data.theme || "light",
          background_color: data.background_color || null,
          banner_mode: (data as any).banner_mode || "strip",
          card_style: (data as any).card_style || "card",
          social_position: (data as any).social_position || "below_products",
          footer_image_url: (data as any).footer_image_url || null,
          text_color: (data as any).text_color || null,
          social_links_color: (data as any).social_links_color || null,
          social_links: (data.social_links as Record<string, string>) || {},
        });
      }

      setLoading(false);
    };

    fetchStore();
  }, [user]);

  return { store, loading, setStore };
}
