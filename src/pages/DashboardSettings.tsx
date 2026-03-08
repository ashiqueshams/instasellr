import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/hooks/use-store";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function DashboardSettings() {
  const { toast } = useToast();
  const { store, loading, setStore } = useStore();
  const [form, setForm] = useState({
    name: "",
    bio: "",
    avatar_initials: "",
    slug: "",
    accent_color: "#ff4545",
    x: "",
    instagram: "",
    youtube: "",
    tiktok: "",
    linkedin: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    setForm({
      name: store.name,
      bio: store.bio,
      avatar_initials: store.avatar_initials,
      slug: store.slug,
      accent_color: store.accent_color,
      x: store.social_links?.x || "",
      instagram: store.social_links?.instagram || "",
      youtube: store.social_links?.youtube || "",
      tiktok: store.social_links?.tiktok || "",
      linkedin: store.social_links?.linkedin || "",
    });
  }, [store]);

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    const { error } = await supabase
      .from("stores")
      .update({
        name: form.name,
        bio: form.bio,
        avatar_initials: form.avatar_initials,
        slug: form.slug,
        accent_color: form.accent_color,
        social_links: {
          x: form.x || undefined,
          instagram: form.instagram || undefined,
          youtube: form.youtube || undefined,
          tiktok: form.tiktok || undefined,
          linkedin: form.linkedin || undefined,
        },
      })
      .eq("id", store.id);

    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved!", description: "Your store has been updated." });
      setStore({
        ...store,
        name: form.name,
        bio: form.bio,
        avatar_initials: form.avatar_initials,
        slug: form.slug,
        accent_color: form.accent_color,
        social_links: { x: form.x, instagram: form.instagram, youtube: form.youtube, tiktok: form.tiktok, linkedin: form.linkedin },
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const inputClass =
    "h-11 rounded-lg bg-background px-3.5 text-sm font-body border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-muted-foreground w-full";

  return (
    <div className="max-w-xl">
      <h1 className="font-heading font-bold text-2xl text-foreground mb-6">Settings</h1>

      <div className="bg-card rounded-xl p-5 store-shadow space-y-4">
        <div>
          <label className="text-xs text-muted-foreground font-body mb-1 block">Store Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-body mb-1 block">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="rounded-lg bg-background px-3.5 py-3 text-sm font-body border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-muted-foreground w-full resize-none h-20"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-body mb-1 block">Avatar Initials</label>
            <input value={form.avatar_initials} maxLength={2} onChange={(e) => setForm({ ...form, avatar_initials: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-body mb-1 block">Accent Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className="w-11 h-11 rounded-lg border border-border cursor-pointer" />
              <input value={form.accent_color} onChange={(e) => setForm({ ...form, accent_color: e.target.value })} className={inputClass} />
            </div>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-body mb-1 block">Store URL Slug</label>
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={inputClass} />
        </div>

        <hr className="border-border" />
        <p className="font-heading font-semibold text-sm text-foreground">Social Links</p>
        {(["x", "instagram", "youtube", "tiktok", "linkedin"] as const).map((key) => (
          <div key={key}>
            <label className="text-xs text-muted-foreground font-body mb-1 block capitalize">{key === "x" ? "X (Twitter)" : key}</label>
            <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={`https://${key}.com/...`} className={inputClass} />
          </div>
        ))}

        <button
          onClick={handleSave}
          disabled={saving}
          className="h-11 w-full rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Settings
        </button>
      </div>
    </div>
  );
}
