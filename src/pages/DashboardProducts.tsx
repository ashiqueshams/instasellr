import { useState, useRef } from "react";
import { sampleProducts, Product } from "@/data/sampleData";
import { Plus, Trash2, X, Upload, FileIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
const MAX_SIZE = 500 * 1024 * 1024; // 500MB

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
  const [uploadedFile, setUploadedFile] = useState<{ name: string; path: string } | null>(null);
  const [uploadedFileData, setUploadedFileData] = useState<{ base64: string; type: string; size: number } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Read file as base64
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 90));
      }
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

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadedFileData(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAdd = async () => {
    if (!form.name || !form.price) {
      toast({ title: "Missing fields", description: "Name and price are required.", variant: "destructive" });
      return;
    }

    // Insert product into Supabase
    const { data, error } = await supabase
      .from("products")
      .insert({
        store_id: "store-1",
        name: form.name,
        tagline: form.tagline || null,
        description: form.description || null,
        price: parseFloat(form.price),
        emoji: form.emoji,
        color: form.color,
        category: form.category || null,
        file_url: uploadedFile ? uploadedFile.name : null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating product", description: error.message, variant: "destructive" });
      return;
    }

    if (data && uploadedFile && uploadedFileData) {
      // Store file in product_files table
      const { error: fileError } = await supabase
        .from("product_files")
        .insert({
          product_id: data.id,
          store_id: data.store_id,
          file_name: uploadedFile.name,
          file_type: uploadedFileData.type,
          file_size: uploadedFileData.size,
          file_data: uploadedFileData.base64,
        });

      if (fileError) {
        toast({ title: "File save failed", description: fileError.message, variant: "destructive" });
      }
    }

    if (data) {
      setProducts([...products, {
        id: data.id,
        store_id: data.store_id,
        name: data.name,
        tagline: data.tagline || "",
        description: data.description || "",
        price: data.price,
        emoji: data.emoji || "🎨",
        color: data.color || "#6C5CE7",
        category: data.category || "",
        file_url: data.file_url,
        is_active: data.is_active ?? true,
        created_at: data.created_at,
      }]);
    }

    setForm({ name: "", tagline: "", description: "", price: "", emoji: "🎨", color: "#6C5CE7", category: "" });
    setUploadedFile(null);
    setUploadedFileData(null);
    setUploadProgress(0);
    setShowForm(false);
    toast({ title: "Product added!" });
  };

  const handleDelete = async (id: string) => {
    // Delete file from storage if exists
    const product = products.find((p) => p.id === id);
    if (product?.file_url) {
      await supabase.storage.from("product-files").remove([product.file_url]);
    }
    await supabase.from("products").delete().eq("id", id);
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
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : uploadedFile ? (
                <div className="border border-border rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileIcon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground truncate">{uploadedFile.name}</span>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center gap-1.5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.zip,.png,.jpg,.jpeg,.mp4"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

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
              <th className="text-left text-xs text-muted-foreground font-body font-medium px-5 py-3">File</th>
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
                <td className="px-5 py-3.5">
                  {product.file_url ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <FileIcon className="w-3 h-3" /> Uploaded
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
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
