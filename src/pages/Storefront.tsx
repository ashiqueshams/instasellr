import { useState, useMemo, useEffect } from "react";
import { Product, Bundle, Store } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import StoreHeader, { SocialIcons } from "@/components/storefront/StoreHeader";
import SearchBar from "@/components/storefront/SearchBar";
import BundleCard from "@/components/storefront/BundleCard";
import ProductList from "@/components/storefront/ProductList";
import ProductDetail from "@/components/storefront/ProductDetail";
import BundleDetail from "@/components/storefront/BundleDetail";
import StorefrontLinks from "@/components/storefront/StorefrontLinks";

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<(Bundle & { products: Product[] })[]>([]);
  const [search, setSearch] = useState("");
  const [storeLinks, setStoreLinks] = useState<any[]>([]);
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
         font_heading: storeData.font_heading || "Syne",
         font_body: storeData.font_body || "Manrope",
         layout: storeData.layout || "list",
         logo_url: storeData.logo_url || null,
         banner_url: storeData.banner_url || null,
         theme: storeData.theme || "light",
         background_color: storeData.background_color || null,
         banner_mode: (storeData as any).banner_mode || "strip",
         card_style: (storeData as any).card_style || "card",
         social_position: (storeData as any).social_position || "below_products",
          footer_image_url: (storeData as any).footer_image_url || null,
          text_color: (storeData as any).text_color || null,
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
        image_url: p.image_url || null,
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

      // Fetch custom links
      const { data: linksData } = await (supabase
        .from("store_links" as any)
        .select("*")
        .eq("store_id", storeData.id)
        .eq("is_active", true)
        .order("position", { ascending: true }) as any);
      setStoreLinks(linksData || []);

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

  const isFullpage = store.banner_mode === "fullpage" && store.banner_url;

  const storeStyle: React.CSSProperties = {
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

  // Fullpage banner mode
  if (isFullpage && !selectedProduct) {
    return (
      <div
        className="min-h-screen relative"
        style={{
          fontFamily: `'${store.font_body}', sans-serif`,
        }}
      >
        {/* Background image */}
        <div
          className="fixed inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${store.banner_url})` }}
        />
        {/* Overlay */}
        <div
          className="fixed inset-0"
          style={{ backgroundColor: store.background_color ? `${store.background_color}99` : "rgba(0,0,0,0.25)" }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-[480px] mx-auto px-5 py-12 pb-24">
          <div className="flex flex-col gap-6">
            <StoreHeader store={store} />

            <SearchBar value={search} onChange={setSearch} />

            {!search && bundles.map((bundle) => (
              <BundleCard key={bundle.id} bundle={bundle} products={bundle.products} onBuyBundle={() => setSelectedBundle(bundle)} />
            ))}

            {!search && storeLinks.length > 0 && <StorefrontLinks links={storeLinks} store={store} />}

            <ProductList
              products={filteredProducts}
              onSelectProduct={setSelectedProduct}
              layout={store.layout}
              cardStyle={store.card_style}
              store={store}
            />

            {/* Social icons (below products) */}
            {store.social_position === "below_products" && (
              <div className="flex justify-center">
                <SocialIcons store={store} />
              </div>
            )}

            {products.length === 0 && (
              <p className="text-center text-sm py-8" style={{ color: store.text_color ? `${store.text_color}99` : undefined }}>No products available yet.</p>
            )}

            {/* Footer image */}
            {store.footer_image_url && (
              <div className="w-full rounded-2xl overflow-hidden mt-4">
                <img src={store.footer_image_url} alt="Footer" className="w-full h-48 object-cover" />
              </div>
            )}
          </div>
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
            {!search && storeLinks.length > 0 && <StorefrontLinks links={storeLinks} store={store} />}
            <ProductList
              products={filteredProducts}
              onSelectProduct={setSelectedProduct}
              layout={store.layout}
              cardStyle={store.card_style}
              store={store}
            />

            {/* Social icons (below products) */}
            {store.social_position === "below_products" && (
              <div className="flex justify-center">
                <SocialIcons store={store} />
              </div>
            )}

            {products.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No products available yet.</p>
            )}

            {/* Footer image */}
            {store.footer_image_url && (
              <div className="w-full rounded-2xl overflow-hidden mt-4">
                <img src={store.footer_image_url} alt="Footer" className="w-full h-48 object-cover" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
