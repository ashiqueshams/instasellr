import { useState, useMemo, useEffect } from "react";
import { sampleStore, Product } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import StoreHeader from "@/components/storefront/StoreHeader";
import SearchBar from "@/components/storefront/SearchBar";
import BundleCard from "@/components/storefront/BundleCard";
import ProductList from "@/components/storefront/ProductList";
import ProductDetail from "@/components/storefront/ProductDetail";
import BundleDetail from "@/components/storefront/BundleDetail";

export default function Storefront() {
  const store = sampleStore;
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showBundle, setShowBundle] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProducts(
          data.map((p) => ({
            id: p.id,
            store_id: p.store_id,
            name: p.name,
            tagline: p.tagline || "",
            description: p.description || "",
            price: p.price,
            emoji: p.emoji || "📦",
            color: p.color || "#6C5CE7",
            category: p.category || "",
            file_url: p.file_url,
            is_active: p.is_active ?? true,
            created_at: p.created_at,
          }))
        );
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.tagline.toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading store…</p>
      </div>
    );
  }

  if (showBundle) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[480px] mx-auto px-5 py-8 pb-24">
          <BundleDetail products={products} store={store} onBack={() => setShowBundle(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[480px] mx-auto px-5 py-8 pb-24">
        {selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            store={store}
            onBack={() => setSelectedProduct(null)}
          />
        ) : (
          <div className="flex flex-col gap-5">
            <StoreHeader store={store} />
            <SearchBar value={search} onChange={setSearch} />
            {!search && products.length > 1 && <BundleCard products={products} onBuyBundle={() => setShowBundle(true)} />}
            <ProductList products={filteredProducts} onSelectProduct={setSelectedProduct} />
          </div>
        )}
      </div>
    </div>
  );
}
