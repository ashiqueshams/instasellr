import { useState, useEffect } from "react";
import { Bundle, Product } from "@/data/sampleData";
import { Plus, Trash2, X, Pencil, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { mapProduct } from "@/lib/mapProduct";
import { useStore } from "@/hooks/use-store";

const EMOJI_OPTIONS = ["🔥", "💎", "🎁", "⚡", "🌟", "🏆", "🎯", "📦"];

export default function DashboardBundles() {
  const { toast } = useToast();
  const { store } = useStore();
  const [bundles, setBundles] = useState<(Bundle & { products?: Product[] })[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    emoji: "🔥",
    color: "#1a1a1a",
    discount_percent: "30",
  });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    if (!store) return;
    fetchData();
  }, [store]);

  const fetchData = async () => {
    if (!store) return;

    const [{ data: productsData }, { data: bundlesData }] = await Promise.all([
      supabase.from("products").select("*").eq("store_id", store.id).eq("is_active", true).order("created_at", { ascending: false }),
      supabase.from("bundles").select("*").eq("store_id", store.id).order("created_at", { ascending: false }) as any,
    ]);

    if (productsData) {
      setProducts(productsData.map((p: any) => mapProduct(p)));
    }

    if (bundlesData) {
      // Fetch bundle items for each bundle
      const bundlesWithProducts = await Promise.all(
        bundlesData.map(async (b: any) => {
          const { data: items } = await supabase.from("bundle_items").select("product_id").eq("bundle_id", b.id) as any;
          const productIds = items?.map((i: any) => i.product_id) || [];
          const bundleProducts = productsData?.filter((p: any) => productIds.includes(p.id)) || [];
          return {
            id: b.id, store_id: b.store_id, name: b.name, description: b.description || "",
            emoji: b.emoji || "🔥", color: b.color || "#1a1a1a", discount_percent: b.discount_percent ?? 30,
            is_active: b.is_active ?? true, created_at: b.created_at,
            products: bundleProducts.map((p: any) => ({
              id: p.id, store_id: p.store_id, name: p.name, tagline: p.tagline || "", description: p.description || "",
              price: p.price, emoji: p.emoji || "📦", color: p.color || "#6C5CE7", category: p.category || "",
              file_url: p.file_url, image_url: p.image_url || null, is_active: p.is_active ?? true, created_at: p.created_at,
            })),
          };
        })
      );
      setBundles(bundlesWithProducts);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ name: "", description: "", emoji: "🔥", color: "#1a1a1a", discount_percent: "30" });
    setSelectedProductIds([]);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (bundle: Bundle & { products?: Product[] }) => {
    setEditingId(bundle.id);
    setForm({
      name: bundle.name,
      description: bundle.description,
      emoji: bundle.emoji,
      color: bundle.color,
      discount_percent: String(bundle.discount_percent),
    });
    setSelectedProductIds(bundle.products?.map((p) => p.id) || []);
    setShowForm(true);
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleSave = async () => {
    if (!form.name) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (selectedProductIds.length < 2) {
      toast({ title: "Select at least 2 products", variant: "destructive" });
      return;
    }
    setSaving(true);

    const bundleData = {
      store_id: store!.id,
      name: form.name,
      description: form.description || null,
      emoji: form.emoji,
      color: form.color,
      discount_percent: parseInt(form.discount_percent) || 30,
      is_active: true,
    };

    if (editingId) {
      const { error } = await (supabase.from("bundles").update(bundleData).eq("id", editingId) as any);
      if (error) {
        toast({ title: "Error updating bundle", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
      // Update bundle items
      await (supabase.from("bundle_items").delete().eq("bundle_id", editingId) as any);
      await (supabase.from("bundle_items").insert(selectedProductIds.map((pid) => ({ bundle_id: editingId, product_id: pid }))) as any);
      toast({ title: "Bundle updated!" });
    } else {
      const { data, error } = await (supabase.from("bundles").insert(bundleData).select().single() as any);
      if (error) {
        toast({ title: "Error creating bundle", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
      if (data) {
        await (supabase.from("bundle_items").insert(selectedProductIds.map((pid) => ({ bundle_id: data.id, product_id: pid }))) as any);
      }
      toast({ title: "Bundle created!" });
    }

    setSaving(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await (supabase.from("bundle_items").delete().eq("bundle_id", id) as any);
    await (supabase.from("bundles").delete().eq("id", id) as any);
    setBundles(bundles.filter((b) => b.id !== id));
    toast({ title: "Bundle deleted" });
  };

  const inputClass = "h-11 rounded-lg bg-background px-3.5 text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl text-foreground">Bundles</h1>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 text-sm font-heading font-semibold hover:brightness-110 active:scale-[0.98] transition-all"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Create Bundle"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl p-5 store-shadow mb-6 animate-fadeUp">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-4">
            {editingId ? "Edit Bundle" : "New Bundle"}
          </h3>
          <div className="space-y-3">
            <input placeholder="Bundle name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`w-full ${inputClass}`} />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg bg-background px-3.5 py-3 text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground resize-none h-20" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Discount %</label>
                <input type="number" min="1" max="99" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} className={inputClass + " w-full"} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Emoji</label>
                <div className="flex flex-wrap gap-1">
                  {EMOJI_OPTIONS.map((e) => (
                    <button key={e} onClick={() => setForm({ ...form, emoji: e })} className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${form.emoji === e ? "bg-primary/10 ring-2 ring-primary" : "bg-background hover:bg-muted"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Product selection */}
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Select Products (min 2)</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                      selectedProductIds.includes(p.id)
                        ? "bg-primary/10 ring-1 ring-primary"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded-md object-cover shrink-0" />
                    ) : (
                      <span className="w-8 h-8 rounded-md flex items-center justify-center text-sm" style={{ backgroundColor: p.color + "20" }}>
                        {p.emoji}
                      </span>
                    )}
                    <span className="text-sm font-body text-foreground flex-1">{p.name}</span>
                    <span className="text-xs text-muted-foreground">${p.price}</span>
                  </button>
                ))}
                {products.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No products yet. Create products first.</p>
                )}
              </div>
            </div>

            {selectedProductIds.length >= 2 && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total value:</span>
                  <span>${products.filter((p) => selectedProductIds.includes(p.id)).reduce((s, p) => s + p.price, 0)}</span>
                </div>
                <div className="flex justify-between font-heading font-semibold text-foreground mt-1">
                  <span>Bundle price ({form.discount_percent}% off):</span>
                  <span>${Math.round(products.filter((p) => selectedProductIds.includes(p.id)).reduce((s, p) => s + p.price, 0) * (1 - (parseInt(form.discount_percent) || 30) / 100))}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="h-11 w-full rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? "Save Changes" : "Create Bundle"}
            </button>
          </div>
        </div>
      )}

      {/* Bundles list */}
      <div className="space-y-3">
        {bundles.map((bundle) => {
          const totalPrice = bundle.products?.reduce((s, p) => s + p.price, 0) || 0;
          const bundlePrice = Math.round(totalPrice * (1 - bundle.discount_percent / 100));
          return (
            <div key={bundle.id} className="bg-card rounded-xl p-4 store-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">{bundle.emoji}</span>
                  <div className="min-w-0">
                    <h3 className="font-heading font-semibold text-sm text-foreground">{bundle.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {bundle.products?.length || 0} products · ${bundlePrice}{" "}
                      <span className="line-through">${totalPrice}</span>{" "}
                      <span className="text-primary">({bundle.discount_percent}% off)</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => startEdit(bundle)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(bundle.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {bundle.products && bundle.products.length > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {bundle.products.map((p) => (
                    <span key={p.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground">
                      {p.emoji} {p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {bundles.length === 0 && !loading && (
          <div className="bg-card rounded-xl store-shadow py-12 text-center text-muted-foreground text-sm">
            No bundles yet. Create your first bundle!
          </div>
        )}
        {loading && (
          <div className="py-12 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading bundles...
          </div>
        )}
      </div>
    </div>
  );
}
