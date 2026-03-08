import { useState } from "react";
import { sampleStore } from "@/data/sampleData";
import { useToast } from "@/hooks/use-toast";

export default function DashboardSettings() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: sampleStore.name,
    bio: sampleStore.bio,
    avatar_initials: sampleStore.avatar_initials,
    slug: sampleStore.slug,
    accent_color: sampleStore.accent_color,
    x: sampleStore.social_links.x || "",
    instagram: sampleStore.social_links.instagram || "",
    youtube: sampleStore.social_links.youtube || "",
    tiktok: sampleStore.social_links.tiktok || "",
    linkedin: sampleStore.social_links.linkedin || "",
  });

  const handleSave = () => {
    toast({ title: "Settings saved!", description: "Your store has been updated." });
  };

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
          className="h-11 w-full rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
