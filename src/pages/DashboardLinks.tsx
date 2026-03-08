import { useState, useEffect } from "react";
import { useStore } from "@/hooks/use-store";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, GripVertical, Trash2, ExternalLink } from "lucide-react";

interface StoreLink {
  id: string;
  store_id: string;
  label: string;
  url: string;
  position: number;
  is_active: boolean;
  created_at: string;
}

export default function DashboardLinks() {
  const { store, loading: storeLoading } = useStore();
  const { toast } = useToast();
  const [links, setLinks] = useState<StoreLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    if (!store) return;
    fetchLinks();
  }, [store]);

  const fetchLinks = async () => {
    if (!store) return;
    const { data } = await supabase
      .from("store_links" as any)
      .select("*")
      .eq("store_id", store.id)
      .order("position", { ascending: true }) as any;
    setLinks(data || []);
    setLoading(false);
  };

  const addLink = async () => {
    if (!store || !newLabel.trim() || !newUrl.trim()) return;
    setSaving(true);
    const { error } = await (supabase.from("store_links" as any).insert({
      store_id: store.id,
      label: newLabel.trim(),
      url: newUrl.trim(),
      position: links.length,
    }) as any);

    if (error) {
      toast({ title: "Failed to add link", variant: "destructive" });
    } else {
      setNewLabel("");
      setNewUrl("");
      await fetchLinks();
      toast({ title: "Link added!" });
    }
    setSaving(false);
  };

  const deleteLink = async (id: string) => {
    await (supabase.from("store_links" as any).delete().eq("id", id) as any);
    setLinks((prev) => prev.filter((l) => l.id !== id));
    toast({ title: "Link deleted" });
  };

  const toggleActive = async (link: StoreLink) => {
    await (supabase.from("store_links" as any).update({ is_active: !link.is_active }).eq("id", link.id) as any);
    setLinks((prev) => prev.map((l) => l.id === link.id ? { ...l, is_active: !l.is_active } : l));
  };

  const moveLink = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= links.length) return;
    const updated = [...links];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    updated.forEach((l, i) => (l.position = i));
    setLinks(updated);
    await Promise.all(
      updated.map((l) => (supabase.from("store_links" as any).update({ position: l.position }).eq("id", l.id) as any))
    );
  };

  if (storeLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const inputClass =
    "h-11 rounded-lg bg-background px-3.5 text-[16px] sm:text-sm font-body border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-muted-foreground w-full";

  return (
    <div className="max-w-xl">
      <h1 className="font-heading font-bold text-2xl text-foreground mb-6">Custom Links</h1>

      {/* Add new link */}
      <div className="bg-card rounded-xl p-5 store-shadow space-y-3 mb-6">
        <p className="font-heading font-semibold text-sm text-foreground">Add a Link</p>
        <div>
          <label className="text-xs text-muted-foreground font-body mb-1 block">Label</label>
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g. Menu, Our Story" className={inputClass} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-body mb-1 block">URL</label>
          <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." className={inputClass} />
        </div>
        <button
          onClick={addLink}
          disabled={saving || !newLabel.trim() || !newUrl.trim()}
          className="h-10 w-full rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add Link
        </button>
      </div>

      {/* Links list */}
      {links.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm py-12">
          No custom links yet. Add your first link above.
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link, index) => (
            <div
              key={link.id}
              className={`bg-card rounded-xl p-4 store-shadow flex items-center gap-3 transition-opacity ${!link.is_active ? "opacity-50" : ""}`}
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveLink(index, -1)}
                  disabled={index === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                >▲</button>
                <button
                  onClick={() => moveLink(index, 1)}
                  disabled={index === links.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                >▼</button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-medium text-sm text-foreground truncate">{link.label}</p>
                <p className="text-xs text-muted-foreground truncate">{link.url}</p>
              </div>
              <button
                onClick={() => toggleActive(link)}
                className={`text-xs font-body px-2.5 py-1 rounded-full border transition-colors ${link.is_active ? "border-primary/30 text-primary bg-primary/10" : "border-border text-muted-foreground"}`}
              >
                {link.is_active ? "Active" : "Hidden"}
              </button>
              <button
                onClick={() => deleteLink(link.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
