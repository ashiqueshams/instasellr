import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/use-store";
import { Switch } from "@/components/ui/switch";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { mapProduct } from "@/lib/mapProduct";
import { Product } from "@/data/sampleData";

export default function PopularManager() {
  const { store } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store) return;
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setProducts((data || []).map((p) => mapProduct(p)));
      setLoading(false);
    })();
  }, [store]);

  const toggle = async (id: string, val: boolean) => {
    const { error } = await supabase.from("products").update({ is_popular: val } as any).eq("id", id);
    if (error) return toast.error("Failed to update");
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, is_popular: val } : p));
  };

  if (loading) return <div className="flex items-center gap-2 text-sm text-muted-foreground p-6"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  const popularCount = products.filter((p) => p.is_popular).length;

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-heading font-bold text-lg">Most Popular Products</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Toggle products to feature in the “Most Popular” row on your storefront. Shows automatically once you mark 3 or more.
        </p>
        <p className="text-xs mt-2">
          <span className="font-semibold">{popularCount}</span> marked · {popularCount >= 3 ? "✅ visible on storefront" : `Mark ${3 - popularCount} more to show`}
        </p>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No products yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-card rounded-xl border border-border p-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: p.color + "18" }}>
                {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : p.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground truncate">৳{p.price}{p.tagline ? ` · ${p.tagline}` : ""}</p>
              </div>
              {p.is_popular && <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />}
              <Switch checked={!!p.is_popular} onCheckedChange={(v) => toggle(p.id, v)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
