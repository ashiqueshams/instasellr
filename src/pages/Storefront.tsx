import { useState, useMemo, useEffect } from "react";
import { Product, Bundle, Store, Category } from "@/data/sampleData";
import { supabase } from "@/integrations/supabase/client";
import { mapProduct } from "@/lib/mapProduct";
import { useParams } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import StoreHeader, { SocialIcons } from "@/components/storefront/StoreHeader";
import SearchBar from "@/components/storefront/SearchBar";
import BundleCard from "@/components/storefront/BundleCard";
import ProductList from "@/components/storefront/ProductList";
import ProductDetail from "@/components/storefront/ProductDetail";
import BundleDetail from "@/components/storefront/BundleDetail";
import StorefrontLinks from "@/components/storefront/StorefrontLinks";
import CartDrawer from "@/components/storefront/CartDrawer";
import CartButton from "@/components/storefront/CartButton";
import CheckoutPage from "@/components/storefront/CheckoutPage";
import HorizontalProductScroll from "@/components/storefront/HorizontalProductScroll";
import SellerInfo from "@/components/storefront/SellerInfo";
import ReviewsSection from "@/components/storefront/ReviewsSection";
import TrackingScripts from "@/components/storefront/TrackingScripts";
import CategoryCards from "@/components/storefront/CategoryCards";
import { useReferral } from "@/hooks/use-referral";
import { Tag, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<(Bundle & { products: Product[] })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [storeLinks, setStoreLinks] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<(Bundle & { products: Product[] }) | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
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

      const mappedProducts: Product[] = (productsData || []).map((p) => mapProduct(p));
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

      // Fetch categories
      const { data: catsData } = await (supabase
        .from("categories" as any)
        .select("*")
        .eq("store_id", storeData.id)
        .eq("is_active", true)
        .order("position", { ascending: true }) as any);
      setCategories((catsData as Category[]) || []);

      setLoading(false);
    };
    fetchStore();
  }, [slug]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (search) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.tagline.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (selectedCategoryId) {
      result = result.filter((p) => p.category_id === selectedCategoryId);
    }
    return result;
  }, [products, search, selectedCategoryId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading store…</p>
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground font-heading font-bold text-xl mb-2">Store not found</p>
          <p className="text-muted-foreground text-sm">This store doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <TrackingScripts storeId={store.id} />
      <StorefrontContent
        store={store}
        products={products}
        filteredProducts={filteredProducts}
        bundles={bundles}
        storeLinks={storeLinks}
        search={search}
        setSearch={setSearch}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        selectedBundle={selectedBundle}
        setSelectedBundle={setSelectedBundle}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        categories={categories}
        showCheckout={showCheckout}
        setShowCheckout={setShowCheckout}
        showAllProducts={showAllProducts}
        setShowAllProducts={setShowAllProducts}
      />
    </CartProvider>
  );
}

interface StorefrontContentProps {
  store: Store;
  products: Product[];
  filteredProducts: Product[];
  bundles: (Bundle & { products: Product[] })[];
  storeLinks: any[];
  search: string;
  setSearch: (s: string) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  selectedBundle: (Bundle & { products: Product[] }) | null;
  setSelectedBundle: (b: (Bundle & { products: Product[] }) | null) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (c: string | null) => void;
  categories: Category[];
  showCheckout: boolean;
  setShowCheckout: (v: boolean) => void;
  showAllProducts: boolean;
  setShowAllProducts: (v: boolean) => void;
}

function StorefrontContent({
  store, products, filteredProducts, bundles, storeLinks, search, setSearch,
  selectedProduct, setSelectedProduct, selectedBundle, setSelectedBundle,
  selectedCategoryId, setSelectedCategoryId, categories,
  showCheckout, setShowCheckout,
  showAllProducts, setShowAllProducts,
}: StorefrontContentProps) {

  const { campaign: referral } = useReferral(store.id);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const fetchRatingStats = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("rating")
        .eq("store_id", store.id) as any;
      if (data && data.length > 0) {
        const sum = data.reduce((s: number, r: any) => s + r.rating, 0);
        setAvgRating(sum / data.length);
        setReviewCount(data.length);
      }
    };
    fetchRatingStats();
  }, [store.id]);

  // Enrich store with computed props for header
  const enrichedStore = {
    ...store,
    _productCount: products.length,
    _hasPhysical: products.some((p) => p.product_type === "physical"),
    _avgRating: avgRating,
    _reviewCount: reviewCount,
  };

  // Shuffle products randomly (stable per session)
  const shuffledProducts = useMemo(() => {
    const arr = [...products];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [products]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedProduct, selectedBundle, showCheckout, showAllProducts]);

  // Detail / checkout views
  if (showCheckout) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-[480px] mx-auto px-5 py-8 pb-28">
          <CheckoutPage store={store} onBack={() => setShowCheckout(false)} referral={referral} />
        </div>
        <CartDrawer store={store} onCheckout={() => setShowCheckout(true)} />
      </div>
    );
  }

  if (selectedBundle) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-[480px] mx-auto px-5 py-8 pb-28">
          <BundleDetail bundle={selectedBundle} products={selectedBundle.products} store={store} onBack={() => setSelectedBundle(null)} />
        </div>
        <CartButton store={store} />
        <CartDrawer store={store} onCheckout={() => setShowCheckout(true)} />
      </div>
    );
  }

  if (selectedProduct) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-[480px] mx-auto px-5 py-8 pb-28">
          <ProductDetail product={selectedProduct} store={store} onBack={() => setSelectedProduct(null)} />
        </div>
        <CartDrawer store={store} onCheckout={() => setShowCheckout(true)} />
      </div>
    );
  }

  // "Shop All" grid view
  if (showAllProducts) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: `'${store.font_body}', sans-serif` }}>
        <div className="max-w-[480px] mx-auto px-5 py-8 pb-28">
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => setShowAllProducts(false)}
              className="w-8 h-8 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <h1 className="font-heading font-bold text-xl">All Products</h1>
          </div>

          <SearchBar value={search} onChange={setSearch} />

          <div className="mt-4">
            <ProductList
              products={filteredProducts}
              onSelectProduct={setSelectedProduct}
              layout={store.layout}
              cardStyle={store.card_style}
              store={store}
            />
          </div>
        </div>
        <CartButton store={store} />
        <CartDrawer store={store} onCheckout={() => setShowCheckout(true)} />
      </div>
    );
  }

  const NEW_BADGE_DAYS = 30;
  const isNew = (p: Product) => {
    if (!p.created_at) return false;
    return Date.now() - new Date(p.created_at).getTime() < NEW_BADGE_DAYS * 86400000;
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: `'${store.font_body}', sans-serif` }}>
      <div className="max-w-[480px] mx-auto px-5 py-8 pb-28">
        <div className="flex flex-col gap-6">
          <StoreHeader store={enrichedStore} />

          <button
            onClick={() => navigate(`/store/${store.slug}/search`)}
            className="relative w-full text-left animate-fadeUp"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <div className="w-full bg-card rounded-lg h-11 pl-10 pr-4 flex items-center text-sm font-body store-shadow text-muted-foreground">
              Search products...
            </div>
          </button>

          {referral && (
            <div
              className="rounded-2xl px-4 py-3 flex items-center gap-3 animate-fadeUp"
              style={{ backgroundColor: store.accent_color + "12", border: `1px solid ${store.accent_color}30` }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: store.accent_color + "20" }}
              >
                <Tag className="w-4 h-4" style={{ color: store.accent_color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm" style={{ color: store.text_color || undefined }}>
                  {referral.discount_percent}% off via {referral.influencer_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Discount auto-applied at checkout · Code <span className="font-mono">{referral.code}</span>
                </p>
              </div>
            </div>
          )}

          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} products={bundle.products} accentColor={store.accent_color} onBuyBundle={() => setSelectedBundle(bundle)} />
          ))}

          {storeLinks.length > 0 && <StorefrontLinks links={storeLinks} store={store} />}

          {categories.length > 0 && (
            <CategoryCards
              categories={categories}
              productCounts={products.reduce((acc, p) => {
                if (p.category_id) acc[p.category_id] = (acc[p.category_id] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)}
              store={store}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />
          )}

          {selectedCategoryId && (
            <div>
              <h3 className="font-heading font-semibold text-sm mb-3" style={{ color: store.text_color || undefined }}>
                {categories.find(c => c.id === selectedCategoryId)?.name} ({filteredProducts.length})
              </h3>
              <ProductList products={filteredProducts} onSelectProduct={setSelectedProduct} layout={store.layout} cardStyle={store.card_style} store={store} isNew={isNew} />
            </div>
          )}

          {!selectedCategoryId && shuffledProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-sm" style={{ color: store.text_color || undefined }}>All Products</h3>
                <span className="text-xs text-muted-foreground">{shuffledProducts.length} items</span>
              </div>
              <ProductList products={shuffledProducts} onSelectProduct={setSelectedProduct} layout={store.layout} cardStyle={store.card_style} store={store} isNew={isNew} />
            </div>
          )}

          <ReviewsSection store={store} />
          <SellerInfo store={store} />

          {store.footer_image_url && (
            <div className="w-full rounded-2xl overflow-hidden">
              <img src={store.footer_image_url} alt="Footer" className="w-full h-48 object-cover" />
            </div>
          )}
        </div>
      </div>

      <CartButton store={store} />
      <CartDrawer store={store} onCheckout={() => setShowCheckout(true)} />
    </div>
  );
}

          {/* Referral banner */}
          {referral && (
            <div
              className="rounded-2xl px-4 py-3 flex items-center gap-3 animate-fadeUp"
              style={{ backgroundColor: store.accent_color + "12", border: `1px solid ${store.accent_color}30` }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: store.accent_color + "20" }}
              >
                <Tag className="w-4 h-4" style={{ color: store.accent_color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm" style={{ color: store.text_color || undefined }}>
                  {referral.discount_percent}% off via {referral.influencer_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Discount auto-applied at checkout · Code <span className="font-mono">{referral.code}</span>
                </p>
              </div>
            </div>
          )}

          {/* Bundles */}
          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} products={bundle.products} accentColor={store.accent_color} onBuyBundle={() => setSelectedBundle(bundle)} />
          ))}

          {/* Custom links */}
          {storeLinks.length > 0 && <StorefrontLinks links={storeLinks} store={store} />}

          {/* Category cards */}
          {categories.length > 0 && (
            <CategoryCards
              categories={categories}
              productCounts={products.reduce((acc, p) => {
                if (p.category_id) acc[p.category_id] = (acc[p.category_id] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)}
              store={store}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />
          )}

          {/* Filtered category results */}
          {selectedCategoryId && (
            <div>
              <h3 className="font-heading font-semibold text-sm mb-3" style={{ color: store.text_color || undefined }}>
                {categories.find(c => c.id === selectedCategoryId)?.name} ({filteredProducts.length})
              </h3>
              <ProductList products={filteredProducts} onSelectProduct={setSelectedProduct} layout={store.layout} cardStyle={store.card_style} store={store} />
            </div>
          )}

          {/* What's New - horizontal scroll */}
          {!selectedCategoryId && newProducts.length > 0 && (
            <HorizontalProductScroll
              title="What's New"
              products={newProducts}
              onSelectProduct={setSelectedProduct}
              store={store}
              onSeeAll={() => setShowAllProducts(true)}
            />
          )}

          {/* Most Popular - horizontal scroll */}
          {!selectedCategoryId && popularProducts.length > 0 && (
            <HorizontalProductScroll
              title="Most Popular"
              products={popularProducts}
              onSelectProduct={setSelectedProduct}
              store={store}
              onSeeAll={() => setShowAllProducts(true)}
            />
          )}

          {/* All products grid */}
          {!selectedCategoryId && products.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-sm" style={{ color: store.text_color || undefined }}>All Products</h3>
                <span className="text-xs text-muted-foreground">{products.length} items</span>
              </div>
              <ProductList products={products} onSelectProduct={setSelectedProduct} layout={store.layout} cardStyle={store.card_style} store={store} />
            </div>
          )}

          {/* Reviews */}
          <ReviewsSection store={store} />

          {/* Seller Information */}
          <SellerInfo store={store} />

          {store.footer_image_url && (
            <div className="w-full rounded-2xl overflow-hidden">
              <img src={store.footer_image_url} alt="Footer" className="w-full h-48 object-cover" />
            </div>
          )}
        </div>
      </div>

      <CartButton store={store} />
      <CartDrawer store={store} onCheckout={() => setShowCheckout(true)} />
    </div>
  );
}
