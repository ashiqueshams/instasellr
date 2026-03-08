import { useState, useMemo, useEffect } from "react";
import { Product, Bundle, Store } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import StoreHeader from "@/components/storefront/StoreHeader";
import SearchBar from "@/components/storefront/SearchBar";
import BundleCard from "@/components/storefront/BundleCard";
import ProductList from "@/components/storefront/ProductList";
import ProductDetail from "@/components/storefront/ProductDetail";
import BundleDetail from "@/components/storefront/BundleDetail";

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<(Bundle & { products: Product[] })[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<(Bundle & { products: Product[] }) | null>(null);
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

      const storeObj: Store = {
        id: storeData.id,
        slug: storeData.slug,
        name: storeData.name,
        bio: storeData.bio || "",
        avatar_initials: storeData.avatar_initials || "",
        accent_color: storeData.accent_color || "#ff4545",
        font_heading: (storeData as any).font_heading || "Syne",
        font_body: (storeData as any).font_body || "Manrope",
        layout: (storeData as any).layout || "list",
        logo_url: (storeData as any).logo_url || null,
        banner_url: (storeData as any).banner_url || null,
        theme: (storeData as any).theme || "light",
        background_color: (storeData as any).background_color || null,
        social_links: (storeData.social_links as Store["social_links"]) || {},
        created_at: storeData.created_at,
        user_id: storeData.user_id || "",
      };
      setStore(storeObj);

      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeData.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      const mappedProducts: Product[] = (productsData || []).map((p) => ({
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
        image_url: (p as any).image_url || null,
        is_active: p.is_active ?? true,
        created_at: p.created_at,
      }));
      setProducts(mappedProducts);

      // Fetch bundles
      const { data: bundlesData } = await (supabase
        .from("bundles")
        .select("*")
        .eq("store_id", storeData.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false }) as any);

      if (bundlesData && bundlesData.length > 0) {
        const bundlesWithProducts = await Promise.all(
          bundlesData.map(async (b: any) => {
            const { data: items } = await (supabase.from("bundle_items").select("product_id").eq("bundle_id", b.id) as any);
            const productIds = items?.map((i: any) => i.product_id) || [];
            return {
              id: b.id, store_id: b.store_id, name: b.name, description: b.description || "",
              emoji: b.emoji || "🔥", color: b.color || "#1a1a1a", discount_percent: b.discount_percent ?? 30,
              is_active: b.is_active ?? true, created_at: b.created_at,
              products: mappedProducts.filter((p) => productIds.includes(p.id)),
            };
          })
        );
        setBundles(bundlesWithProducts.filter((b) => b.products.length >= 2));
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

  const storeStyle = {
    fontFamily: `'${store.font_body}', sans-serif`,
    backgroundColor: store.background_color || undefined,
  };

  if (selectedBundle) {
    return (
      <div className="min-h-screen" style={storeStyle}>
        <div className="max-w-[480px] mx-auto px-5 py-8 pb-24" style={{ fontFamily: `'${store.font_body}', sans-serif` }}>
          <BundleDetail
            bundle={selectedBundle}
            products={selectedBundle.products}
            store={store}
            onBack={() => setSelectedBundle(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={storeStyle}>
      <div className="max-w-[480px] mx-auto px-5 py-8 pb-24">
        {selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            store={store}
            onBack={() => setSelectedProduct(null)}
          />
        ) : (
          <div className="flex flex-col gap-5" style={{ fontFamily: `'${store.font_body}', sans-serif` }}>
            <StoreHeader store={store} />
            <SearchBar value={search} onChange={setSearch} />
            {!search && bundles.map((bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} products={bundle.products} onBuyBundle={() => setSelectedBundle(bundle)} />
            ))}
            <ProductList products={filteredProducts} onSelectProduct={setSelectedProduct} layout={store.layout} />
            {products.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No products available yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
