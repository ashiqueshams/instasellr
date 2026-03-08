import { useState, useMemo, useEffect } from "react";
import { Product } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import StoreHeader from "@/components/storefront/StoreHeader";
import SearchBar from "@/components/storefront/SearchBar";
import BundleCard from "@/components/storefront/BundleCard";
import ProductList from "@/components/storefront/ProductList";
import ProductDetail from "@/components/storefront/ProductDetail";
import BundleDetail from "@/components/storefront/BundleDetail";

interface StoreData {
  id: string;
  slug: string;
  name: string;
  bio: string;
  avatar_initials: string;
  accent_color: string;
  social_links: {
    x?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    linkedin?: string;
  };
  created_at: string;
  user_id: string;
}

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showBundle, setShowBundle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchStore = async () => {
      const { data: storeData, error } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!storeData || error) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setStore({
        id: storeData.id,
        slug: storeData.slug,
        name: storeData.name,
        bio: storeData.bio || "",
        avatar_initials: storeData.avatar_initials || "",
        accent_color: storeData.accent_color || "#ff4545",
        social_links: (storeData.social_links as StoreData["social_links"]) || {},
        created_at: storeData.created_at,
        user_id: storeData.user_id || "",
      });

      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeData.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (productsData) {
        setProducts(
          productsData.map((p) => ({
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
    fetchStore();
  }, [slug]);

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

  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground font-heading font-bold text-xl mb-2">Store not found</p>
          <p className="text-muted-foreground text-sm">This store doesn't exist or has been removed.</p>
        </div>
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
            {products.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No products available yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
