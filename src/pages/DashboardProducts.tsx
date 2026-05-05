import { useState, useRef, useEffect } from "react";
import { Product } from "@/data/sampleData";
import { Plus, Trash2, X, Upload, FileIcon, Loader2, Pencil, ImageIcon, Copy, Power } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/use-store";
import { uploadImage } from "@/lib/imageUpload";
import { mapProduct } from "@/lib/mapProduct";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CategoriesManager from "@/components/dashboard/CategoriesManager";

export default function DashboardProductsPage() {
  return (
    <Tabs defaultValue="products" className="w-full">
      <TabsList>
        <TabsTrigger value="products">Products</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
      </TabsList>
      <TabsContent value="products" className="mt-4">
        <DashboardProducts />
      </TabsContent>
      <TabsContent value="categories" className="mt-4">
        <CategoriesManager />
      </TabsContent>
    </Tabs>
  );
}


const EMOJI_OPTIONS = ["🎨", "✨", "📝", "📦", "🎯", "💎", "🚀", "🔥", "📚", "🎵", "📸", "🛠️"];
const COLOR_OPTIONS = ["#6C5CE7", "#00B894", "#E17055", "#0984E3", "#FDCB6E", "#E84393", "#636E72", "#2D3436"];
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "image/png",
  "image/jpeg",
  "video/mp4",
];
const MAX_SIZE = 500 * 1024 * 1024;

interface ProductForm {
  name: string;
  tagline: string;
  description: string;
  price: string;
  compare_at_price: string;
  emoji: string;
  color: string;
  category: string;
  category_id: string;
  product_type: "digital" | "physical";
  stock_quantity: string;
  weight: string;
  material: string;
  care_instructions: string;
}

const emptyForm: ProductForm = {
  name: "",
  tagline: "",
  description: "",
  price: "",
  compare_at_price: "",
  emoji: "🎨",
  color: "#6C5CE7",
  category: "",
  category_id: "",
  product_type: "digital",
  stock_quantity: "",
  weight: "",
  material: "",
  care_instructions: "",
};

function DashboardProducts() {
  const { toast } = useToast();
  const { store } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; path: string } | null>(null);
  const [uploadedFileData, setUploadedFileData] = useState<{ base64: string; type: string; size: number } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!store) return;
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });
      if (data) {
        setProducts(data.map((p) => mapProduct(p)));
      }
      if (error) {
        toast({ title: "Failed to load products", description: error.message, variant: "destructive" });
      }
      setLoading(false);
    };
    fetchProducts();
  }, [store]);

  const resetForm = () => {
    setForm(emptyForm);
    setUploadedFile(null);
    setUploadedFileData(null);
    setUploadProgress(0);
    setProductImage(null);
    setProductImagePreview(null);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      tagline: product.tagline,
      description: product.description,
      price: String(product.price),
      compare_at_price: product.compare_at_price ? String(product.compare_at_price) : "",
      emoji: product.emoji,
      color: product.color,
      category: product.category,
      category_id: product.category_id || "",
      product_type: product.product_type || "digital",
      stock_quantity: product.stock_quantity != null ? String(product.stock_quantity) : "",
      weight: product.weight != null ? String(product.weight) : "",
      material: product.material || "",
      care_instructions: product.care_instructions || "",
    });
    setProductImagePreview(product.image_url);
    setUploadedFile(product.file_url ? { name: product.file_url, path: "" } : null);
    setShowForm(true);
  };

  const handleDuplicate = async (product: Product) => {
    if (!store) return;
    const productData = {
      store_id: store.id,
      name: `${product.name} (Copy)`,
      tagline: product.tagline || null,
      description: product.description || null,
      price: product.price,
      emoji: product.emoji,
      color: product.color,
      category: product.category || null,
      image_url: product.image_url,
      is_active: true,
      product_type: product.product_type,
      stock_quantity: product.stock_quantity,
      compare_at_price: product.compare_at_price,
      weight: product.weight,
    };
    const { data, error } = await supabase.from("products").insert(productData as any).select().single();
    if (error) {
      toast({ title: "Failed to duplicate", description: error.message, variant: "destructive" });
      return;
    }
    if (data) {
      setProducts([mapProduct(data), ...products]);
      toast({ title: "Product duplicated!" });
    }
  };

  const handleToggleActive = async (product: Product) => {
    const newActive = !product.is_active;
    const { error } = await supabase.from("products").update({ is_active: newActive }).eq("id", product.id);
    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
      return;
    }
    setProducts(products.map((p) => p.id === product.id ? { ...p, is_active: newActive } : p));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Supported: PDF, ZIP, PNG, JPEG, MP4", variant: "destructive" });
      return;
    }
    if (file.size > MAX_SIZE) {
      toast({ title: "File too large", description: "Max file size is 500MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 90));
    };
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setUploadProgress(100);
      setUploadedFile({ name: file.name, path: "" });
      setUploadedFileData({ base64, type: file.type, size: file.size });
      setUploading(false);
      toast({ title: "File ready!" });
    };
    reader.onerror = () => {
      setUploading(false);
      setUploadProgress(0);
      toast({ title: "Failed to read file", variant: "destructive" });
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max image size is 5MB", variant: "destructive" });
      return;
    }
    setProductImage(file);
    setProductImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadedFileData(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = () => {
    setProductImage(null);
    setProductImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast({ title: "Missing fields", description: "Name and price are required.", variant: "destructive" });
      return;
    }
    setSaving(true);

    let imageUrl: string | null = productImagePreview;
    if (productImage) {
      const url = await uploadImage(productImage, `products/${store!.id}`);
      if (url) imageUrl = url;
      else {
        toast({ title: "Image upload failed", variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    const productData = {
      store_id: store!.id,
      name: form.name,
      tagline: form.tagline || null,
      description: form.description || null,
      price: parseFloat(form.price),
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      emoji: form.emoji,
      color: form.color,
      category: form.category || null,
      file_url: uploadedFile ? uploadedFile.name : null,
      image_url: imageUrl,
      is_active: true,
      product_type: form.product_type,
      stock_quantity: form.product_type === "physical" && form.stock_quantity ? parseInt(form.stock_quantity) : null,
      weight: form.product_type === "physical" && form.weight ? parseFloat(form.weight) : null,
      material: form.material || null,
      care_instructions: form.care_instructions || null,
    };

    if (editingId) {
      const { data, error } = await supabase
        .from("products")
        .update(productData as any)
        .eq("id", editingId)
        .select()
        .single();

      if (error) {
        toast({ title: "Error updating product", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }

      if (uploadedFileData) {
        await supabase.from("product_files").delete().eq("product_id", editingId);
        await supabase.from("product_files").insert({
          product_id: editingId,
          store_id: store!.id,
          file_name: uploadedFile!.name,
          file_type: uploadedFileData.type,
          file_size: uploadedFileData.size,
          file_data: uploadedFileData.base64,
        });
      }

      if (data) {
        setProducts(products.map((p) => p.id === editingId ? mapProduct(data) : p));
      }
      toast({ title: "Product updated!" });
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(productData as any)
        .select()
        .single();

      if (error) {
        toast({ title: "Error creating product", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }

      if (data && uploadedFile && uploadedFileData) {
        await supabase.from("product_files").insert({
          product_id: data.id,
          store_id: data.store_id,
          file_name: uploadedFile.name,
          file_type: uploadedFileData.type,
          file_size: uploadedFileData.size,
          file_data: uploadedFileData.base64,
        });
      }

      if (data) {
        setProducts([mapProduct(data), ...products]);
      }
      toast({ title: "Product added!" });
    }

    setSaving(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("product_files").delete().eq("product_id", id);
    await supabase.from("products").delete().eq("id", id);
    setProducts(products.filter((p) => p.id !== id));
    toast({ title: "Product deleted" });
  };

  const inputClass = "h-11 rounded-lg bg-background px-3.5 text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl text-foreground">Products</h1>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className="h-10 px-4 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 text-sm font-heading font-semibold hover:brightness-110 active:scale-[0.98] transition-all"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add Product"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl p-5 store-shadow mb-6 animate-fadeUp">
          <h3 className="font-heading font-semibold text-sm text-foreground mb-4">
            {editingId ? "Edit Product" : "New Product"}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Product type toggle */}
            <div className="col-span-2 flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, product_type: "digital" })}
                className={`flex-1 h-10 rounded-lg text-sm font-semibold transition-all ${form.product_type === "digital" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                🖥️ Digital
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, product_type: "physical" })}
                className={`flex-1 h-10 rounded-lg text-sm font-semibold transition-all ${form.product_type === "physical" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                📦 Physical
              </button>
            </div>
            <input placeholder="Product name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`col-span-2 ${inputClass}`} />
            <input placeholder="Tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={`col-span-2 ${inputClass}`} />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="col-span-2 rounded-lg bg-background px-3.5 py-3 text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground resize-none h-24" />
            <input placeholder="Price *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} />
            <input placeholder="Compare-at price" type="number" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} className={inputClass} />
            <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} />

            {/* Physical product fields */}
            {form.product_type === "physical" && (
              <>
                <input placeholder="Stock quantity" type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className={inputClass} />
                <input placeholder="Weight (grams)" type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className={inputClass} />
              </>
            )}
            <input placeholder="Material (e.g. cotton, georgette)" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className={`col-span-2 ${inputClass}`} />
            <textarea placeholder="Care instructions (used by chatbot to answer material questions)" value={form.care_instructions} onChange={(e) => setForm({ ...form, care_instructions: e.target.value })} className="col-span-2 rounded-lg bg-background px-3.5 py-3 text-sm border border-border outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground resize-none h-20" />

            {/* Product Image */}
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-1.5">Product Image (optional — shown instead of emoji)</p>
              {productImagePreview ? (
                <div className="border border-border rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={productImagePreview} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                    <span className="text-sm text-foreground truncate">Product image</span>
                  </div>
                  <button onClick={handleRemoveImage} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button onClick={() => imageInputRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors">
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload image (max 5MB)</span>
                </button>
              )}
              <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </div>

            {/* File upload */}
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-1.5">Digital File (PDF, ZIP, PNG, MP4 — max 500MB)</p>
              {uploading ? (
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : uploadedFile ? (
                <div className="border border-border rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileIcon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground truncate">{uploadedFile.name}</span>
                  </div>
                  {!editingId && (
                    <button onClick={handleRemoveFile} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf,.zip,.png,.jpg,.jpeg,.mp4" onChange={handleFileSelect} className="hidden" />
            </div>

            {/* Emoji picker */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Emoji</p>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_OPTIONS.map((e) => (
                  <button key={e} onClick={() => setForm({ ...form, emoji: e })} className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${form.emoji === e ? "bg-primary/10 ring-2 ring-primary" : "bg-background hover:bg-muted"}`}>
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
                  <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-9 h-9 rounded-lg transition-all ${form.color === c ? "ring-2 ring-primary scale-110" : "hover:scale-105"}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 h-11 w-full rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {editingId ? "Save Changes" : "Create Product"}
          </button>
        </div>
      )}

      {/* Products table */}
      <div className="bg-card rounded-xl store-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Product</th>
                <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Category</th>
                <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Price</th>
                <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Stock</th>
                <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">Active</th>
                <th className="text-right text-xs text-muted-foreground font-body font-medium px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <span className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: product.color + "20" }}>
                          {product.emoji}
                        </span>
                      )}
                      <div>
                        <p className="font-heading font-semibold text-sm text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.tagline}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">{product.category || "—"}</td>
                  <td className="px-5 py-3.5">
                    <div>
                      <span className="font-heading font-semibold text-sm text-foreground">${product.price}</span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="ml-1.5 text-xs text-muted-foreground line-through">${product.compare_at_price}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {product.product_type === "physical" ? (
                      product.stock_quantity != null ? (
                        <span className={`text-sm font-medium ${product.stock_quantity === 0 ? "text-destructive" : product.stock_quantity <= 5 ? "text-yellow-600" : "text-foreground"}`}>
                          {product.stock_quantity === 0 ? "Out of stock" : product.stock_quantity}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">∞</span>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <Switch
                      checked={product.is_active}
                      onCheckedChange={() => handleToggleActive(product)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => startEdit(product)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(product)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && !loading && (
          <div className="py-12 text-center text-muted-foreground text-sm">No products yet. Add your first one!</div>
        )}
        {loading && (
          <div className="py-12 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading products...
          </div>
        )}
      </div>
    </div>
  );
}
