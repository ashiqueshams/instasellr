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

    const fetchOrCreateStore = async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
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
      } else if (!error || error.code === "PGRST116") {
        const slug = user.email?.split("@")[0]?.replace(/[^a-z0-9]/gi, "-") || "my-store";
        const displayName = user.user_metadata?.display_name || user.email || "My Store";
        const initials = displayName.slice(0, 2).toUpperCase();

        const { data: newStore, error: createError } = await supabase
          .from("stores")
          .insert({
            user_id: user.id,
            slug,
            name: displayName,
            avatar_initials: initials,
          })
          .select()
          .single();

        if (newStore) {
          setStore({
            id: newStore.id,
            slug: newStore.slug,
            name: newStore.name,
            bio: newStore.bio || "",
            avatar_initials: newStore.avatar_initials || "",
            accent_color: newStore.accent_color || "#ff4545",
            font_heading: newStore.font_heading || "Syne",
            font_body: newStore.font_body || "Manrope",
            layout: newStore.layout || "list",
            logo_url: newStore.logo_url || null,
            banner_url: newStore.banner_url || null,
            theme: newStore.theme || "light",
            background_color: newStore.background_color || null,
            banner_mode: (newStore as any).banner_mode || "strip",
            card_style: (newStore as any).card_style || "card",
            social_position: (newStore as any).social_position || "below_products",
            footer_image_url: (newStore as any).footer_image_url || null,
            text_color: (newStore as any).text_color || null,
            social_links_color: (newStore as any).social_links_color || null,
            social_links: (newStore.social_links as Record<string, string>) || {},
          });
        }
      }
      setLoading(false);
    };

    fetchOrCreateStore();
  }, [user]);

  return { store, loading, setStore };
}
