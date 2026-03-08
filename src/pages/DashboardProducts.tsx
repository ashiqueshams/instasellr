import { useState } from "react";
import { sampleProducts, Product } from "@/data/sampleData";
import { Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EMOJI_OPTIONS = ["🎨", "✨", "📝", "📦", "🎯", "💎", "🚀", "🔥", "📚", "🎵", "📸", "🛠️"];
const COLOR_OPTIONS = ["#6C5CE7", "#00B894", "#E17055", "#0984E3", "#FDCB6E", "#E84393", "#636E72", "#2D3436"];

export default function DashboardProducts() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    description: "",
    price: "",
    emoji: "🎨",
    color: "#6C5CE7",
    category: "",
  });

  const handleAdd = () => {
    if (!form.name || !form.price) {
      toast({ title: "Missing fields", description: "Name and price are required.", variant: "destructive" });
      return;
    }
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      store_id: "store-1",
      name: form.name,
      tagline: form.tagline,
      description: form.description,
      price: parseFloat(form.price),
      emoji: form.emoji,
      color: form.color,
      category: form.category,
      file_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    setProducts([...products, newProduct]);
    setForm({ name: "", tagline: "", description: "", price: "", emoji: "🎨", color: "#6C5CE7", category: "" });
    setShowForm(false);
    toast({ title: "Product added!" });
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
    toast({ title: "Product deleted" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl text-foreground">Products</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 text-sm font-heading font-semibold hover:brightness-110 active:scale-[0.98] transition-all"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add Product"}
        </button>
      </div>

      {/* Add product form */}
      {showForm && (
        <div className="bg-card rounded-xl p-5 store-shadow mb-6 animate-fadeUp">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-4">New Product</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Product name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="col-span-2 h-11 rounded-lg bg-background px-3.5 text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
            />
            <input
              placeholder="Tagline"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="col-span-2 h-11 rounded-lg bg-background px-3.5 text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="col-span-2 rounded-lg bg-background px-3.5 py-3 text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground resize-none h-24"
            />
            <input
              placeholder="Price *"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="h-11 rounded-lg bg-background px-3.5 text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
            />
            <input
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="h-11 rounded-lg bg-background px-3.5 text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
            />

            {/* Emoji picker */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Emoji</p>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setForm({ ...form, emoji: e })}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                      form.emoji === e ? "bg-primary/10 ring-2 ring-primary" : "bg-background hover:bg-muted"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Color</p>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-9 h-9 rounded-lg transition-all ${
                      form.color === c ? "ring-2 ring-primary scale-110" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="mt-4 h-11 w-full rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Create Product
          </button>
        </div>
      )}

      {/* Products table */}
      <div className="bg-card rounded-xl store-shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Product</th>
              <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Category</th>
              <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Price</th>
              <th className="text-right text-xs text-muted-foreground font-body font-medium px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: product.color + "20" }}
                    >
                      {product.emoji}
                    </span>
                    <div>
                      <p className="font-heading font-semibold text-sm text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.tagline}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-muted-foreground">{product.category || "—"}</td>
                <td className="px-5 py-3.5 font-heading font-semibold text-sm text-foreground">${product.price}</td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">No products yet. Add your first one!</div>
        )}
      </div>
    </div>
  );
}
