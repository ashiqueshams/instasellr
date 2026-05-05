import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/use-store";
import { uploadImage } from "@/lib/imageUpload";
import { useToast } from "@/hooks/use-toast";
import { Category, Product } from "@/data/sampleData";
import { mapProduct } from "@/lib/mapProduct";
import { Plus, Trash2, Pencil, X, ImageIcon, Loader2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";

export default function CategoriesManager() {
  const { store } = useStore();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!store) return;
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from("categories" as any).select("*").eq("store_id", store.id).order("position"),
      supabase.from("products").select("*").eq("store_id", store.id).order("position").order("created_at", { ascending: false }),
    ]);
    setCategories((cats as any) || []);
    setProducts((prods || []).map(mapProduct));
    setLoading(false);
  };

  useEffect(() => { load(); }, [store]);

  const reset = () => {
    setName(""); setImage(null); setImagePreview(null); setEditingId(null); setShowForm(false);
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setName(c.name);
    setImagePreview(c.image_url);
    setImage(null);
    setShowForm(true);
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast({ title: "Too large", description: "Max 10MB", variant: "destructive" });
      return;
    }
    setImage(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const save = async () => {
    if (!store || !name.trim()) return;
    setSaving(true);
    let imageUrl: string | null = imagePreview;
    if (image) {
      const url = await uploadImage(image, `categories/${store.id}`);
      if (url) imageUrl = url;
    }
    if (editingId) {
      const { error } = await supabase.from("categories" as any).update({ name, image_url: imageUrl }).eq("id", editingId);
      if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      const position = categories.length;
      const { error } = await supabase.from("categories" as any).insert({ store_id: store.id, name, image_url: imageUrl, position });
      if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    }
    setSaving(false);
    reset();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category? Products will be uncategorized.")) return;
    await supabase.from("products").update({ category_id: null } as any).eq("category_id", id);
    await supabase.from("categories" as any).delete().eq("id", id);
    load();
  };

  const moveCategory = async (idx: number, dir: -1 | 1) => {
    const next = [...categories];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setCategories(next);
    await Promise.all(next.map((c, i) =>
      supabase.from("categories" as any).update({ position: i }).eq("id", c.id)
    ));
  };

  const setProductCategory = async (productId: string, categoryId: string | null) => {
    await supabase.from("products").update({ category_id: categoryId } as any).eq("id", productId);
    setProducts(products.map(p => p.id === productId ? { ...p, category_id: categoryId } : p));
  };

  const moveProduct = async (catId: string, productId: string, dir: -1 | 1) => {
    const inCat = products.filter(p => p.category_id === catId).sort((a, b) => (a.position || 0) - (b.position || 0));
    const idx = inCat.findIndex(p => p.id === productId);
    const target = idx + dir;
    if (target < 0 || target >= inCat.length) return;
    [inCat[idx], inCat[target]] = [inCat[target], inCat[idx]];
    await Promise.all(inCat.map((p, i) =>
      supabase.from("products").update({ position: i } as any).eq("id", p.id)
    ));
    setProducts(products.map(p => {
      const found = inCat.find(x => x.id === p.id);
      if (!found) return p;
      return { ...p, position: inCat.indexOf(found) };
    }));
  };

  const productsInCat = (catId: string) =>
    products.filter(p => p.category_id === catId).sort((a, b) => (a.position || 0) - (b.position || 0));
  const uncategorized = products.filter(p => !p.category_id);

  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-xl text-foreground">Categories</h2>
          <p className="text-sm text-muted-foreground">Group products into categories with custom images.</p>
        </div>
        <button
          onClick={() => { if (showForm) reset(); else setShowForm(true); }}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 text-sm font-heading font-semibold hover:brightness-110 transition-all"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add Category"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl p-5 store-shadow mb-6 animate-fadeUp">
          <h3 className="font-heading font-semibold text-sm mb-4">{editingId ? "Edit Category" : "New Category"}</h3>
          <div className="grid gap-3">
            <input
              placeholder="Category name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-lg bg-background px-3.5 text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Image / GIF (shown on home page card)</p>
              {imagePreview ? (
                <div className="border border-border rounded-lg p-3 flex items-center justify-between">
                  <img src={imagePreview} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  <button onClick={() => { setImage(null); setImagePreview(null); }} className="w-7 h-7 rounded-md text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-1.5 hover:border-primary/40 hover:bg-primary/5">
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload image or GIF</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*,image/gif" onChange={handleImage} className="hidden" />
            </div>
          </div>
          <button onClick={save} disabled={saving} className="mt-4 h-11 w-full rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {editingId ? "Save Changes" : "Create Category"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {categories.map((c, idx) => {
          const items = productsInCat(c.id);
          const open = expandedCat === c.id;
          return (
            <div key={c.id} className="bg-card rounded-xl store-shadow overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <div className="flex flex-col">
                  <button onClick={() => moveCategory(idx, -1)} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => moveCategory(idx, 1)} disabled={idx === categories.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                </div>
                {c.image_url ? (
                  <img src={c.image_url} alt={c.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"><ImageIcon className="w-5 h-5" /></div>
                )}
                <button className="flex-1 text-left" onClick={() => setExpandedCat(open ? null : c.id)}>
                  <p className="font-heading font-semibold text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{items.length} products</p>
                </button>
                <button onClick={() => startEdit(c)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => remove(c.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
              </div>
              {open && (
                <div className="border-t border-border p-4 space-y-2">
                  {items.length === 0 && <p className="text-xs text-muted-foreground">No products. Assign products from the list below.</p>}
                  {items.map((p, pi) => (
                    <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-background">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <button onClick={() => moveProduct(c.id, p.id, -1)} disabled={pi === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                        <button onClick={() => moveProduct(c.id, p.id, 1)} disabled={pi === items.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                      </div>
                      {p.image_url ? <img src={p.image_url} className="w-8 h-8 rounded object-cover" /> : <span className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: p.color + "20" }}>{p.emoji}</span>}
                      <span className="flex-1 text-sm truncate">{p.name}</span>
                      <button onClick={() => setProductCategory(p.id, null)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {categories.length === 0 && !showForm && (
        <div className="bg-card rounded-xl p-8 text-center text-sm text-muted-foreground">No categories yet. Create your first one!</div>
      )}

      {categories.length > 0 && uncategorized.length > 0 && (
        <div className="mt-6 bg-card rounded-xl p-4 store-shadow">
          <h3 className="font-heading font-semibold text-sm mb-3">Uncategorized products ({uncategorized.length})</h3>
          <div className="space-y-2">
            {uncategorized.map(p => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-background">
                {p.image_url ? <img src={p.image_url} className="w-8 h-8 rounded object-cover" /> : <span className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: p.color + "20" }}>{p.emoji}</span>}
                <span className="flex-1 text-sm truncate">{p.name}</span>
                <select
                  className="h-8 rounded-md border border-border bg-background text-xs px-2"
                  value=""
                  onChange={(e) => e.target.value && setProductCategory(p.id, e.target.value)}
                >
                  <option value="">Assign to…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
