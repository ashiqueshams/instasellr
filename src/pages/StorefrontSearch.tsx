import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mapProduct } from "@/lib/mapProduct";
import { Product, Store } from "@/data/sampleData";
import { CartProvider } from "@/contexts/CartContext";
import SearchBar from "@/components/storefront/SearchBar";
import ProductList from "@/components/storefront/ProductList";
import ProductDetail from "@/components/storefront/ProductDetail";
import CartButton from "@/components/storefront/CartButton";
import CartDrawer from "@/components/storefront/CartDrawer";
import CheckoutPage from "@/components/storefront/CheckoutPage";

export default function StorefrontSearch() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: s } = await supabase.from("stores").select("*").eq("slug", slug).maybeSingle();
      if (!s) { setLoading(false); return; }
      setStore({
        id: s.id, slug: s.slug, name: s.name, bio: s.bio || "",
        avatar_initials: s.avatar_initials || "", accent_color: s.accent_color || "#ff4545",
        font_heading: s.font_heading || "Syne", font_body: s.font_body || "Manrope",
        layout: s.layout || "list", logo_url: s.logo_url, banner_url: s.banner_url,
        theme: s.theme || "light", background_color: s.background_color || null,
        banner_mode: (s as any).banner_mode || "strip", card_style: (s as any).card_style || "card",
        social_position: (s as any).social_position || "below_products",
        footer_image_url: (s as any).footer_image_url || null,
        text_color: (s as any).text_color || null,
        social_links: (s.social_links as any) || {}, created_at: s.created_at, user_id: s.user_id || "",
      });
      const { data: ps } = await supabase.from("products").select("*").eq("store_id", s.id).eq("is_active", true).order("created_at", { ascending: false });
      setProducts((ps || []).map(mapProduct));
      setLoading(false);
    })();
  }, [slug]);

  const isNew = (p: Product) => p.created_at && Date.now() - new Date(p.created_at).getTime() < 30 * 86400000;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
    );
  }, [products, search]);

  if (loading || !store) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (showCheckout) {
    return (
      <CartProvider>
        <div className="min-h-screen bg-white">
          <div className="max-w-[480px] mx-auto px-5 py-8 pb-28">
            <CheckoutPage store={store} onBack={() => setShowCheckout(false)} referral={null as any} />
          </div>
          <CartDrawer store={store} onCheckout={() => setShowCheckout(true)} />
        </div>
      </CartProvider>
    );
  }

  if (selectedProduct) {
    return (
      <CartProvider>
        <div className="min-h-screen bg-white">
          <div className="max-w-[480px] mx-auto px-5 py-8 pb-28">
            <ProductDetail product={selectedProduct} store={store} onBack={() => setSelectedProduct(null)} />
          </div>
          <CartDrawer store={store} onCheckout={() => setShowCheckout(true)} />
        </div>
      </CartProvider>
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-white" style={{ fontFamily: `'${store.font_body}', sans-serif` }}>
        <div className="max-w-[480px] mx-auto px-5 py-8 pb-28">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate(`/store/${store.slug}`)} className="w-9 h-9 rounded-full bg-card flex items-center justify-center hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="font-heading font-bold text-xl">Search</h1>
          </div>

          <SearchBar value={search} onChange={setSearch} />

          <div className="mt-5">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                {search ? "No products match your search." : "Start typing to search products."}
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-3">{filtered.length} {filtered.length === 1 ? "result" : "results"}</p>
                <ProductList products={filtered} onSelectProduct={setSelectedProduct} layout={store.layout} cardStyle={store.card_style} store={store} isNew={isNew} />
              </>
            )}
          </div>
        </div>
        <CartButton store={store} />
        <CartDrawer store={store} onCheckout={() => setShowCheckout(true)} />
      </div>
    </CartProvider>
  );
}
