import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Product, Store } from "@/data/sampleData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProductDetailProps {
  product: Product;
  store: Store;
  onBack: () => void;
}

export default function ProductDetail({ product, store, onBack }: ProductDetailProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const included = [
    "Instant digital download",
    "Lifetime access & updates",
    "Commercial license included",
    "Premium support via email",
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (formRef.current) observer.observe(formRef.current);
    return () => observer.disconnect();
  }, []);

  const handleBuy = async () => {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Please enter your name.", variant: "destructive" });
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Valid email required", description: "Please enter a valid email.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-order", {
        body: {
          product_id: product.id,
          store_id: product.store_id,
          customer_name: name,
          customer_email: email,
          amount: product.price,
        },
      });

      if (error) throw error;
      setPurchased(true);
    } catch (err: any) {
      toast({ title: "Purchase failed", description: err.message || "Please try again.", variant: "destructive" });
    }
    setLoading(false);
  };

  if (purchased) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-popIn">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="font-heading font-bold text-xl text-foreground">Purchase Successful!</h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-[260px]">
          A download link has been sent to <span className="font-semibold text-foreground">{email}</span>
        </p>
        <button
          onClick={onBack}
          className="mt-6 h-10 px-6 rounded-lg bg-card store-shadow font-heading font-semibold text-sm text-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          ← Back to Store
        </button>
      </div>
    );
  }

  return (
    <div className="animate-slideInRight">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Hero */}
      <div
        className="rounded-xl p-6 text-center mb-6"
        style={{ backgroundColor: product.color + "15" }}
      >
        <span className="text-5xl block mb-3">{product.emoji}</span>
        <h2 className="font-heading font-bold text-xl text-foreground">{product.name}</h2>
        <p className="text-muted-foreground text-sm mt-1">{product.tagline}</p>
        <p className="font-heading font-bold text-2xl mt-3" style={{ color: store.accent_color }}>
          ${product.price}
        </p>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-2">About this product</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
      </div>

      {/* What's included */}
      <div className="mb-6">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-3">What's included</h3>
        <div className="flex flex-col gap-2.5">
          {included.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: store.accent_color + "18" }}
              >
                <Check className="w-3 h-3" style={{ color: store.accent_color }} />
              </div>
              <span className="text-sm text-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Purchase form */}
      <div ref={formRef} className="bg-card rounded-xl p-5 store-shadow">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Complete your purchase</h3>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-lg bg-background px-3.5 text-sm font-body border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-muted-foreground"
          />
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 rounded-lg bg-background px-3.5 text-sm font-body border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-muted-foreground"
          />
          <button
            onClick={handleBuy}
            disabled={loading}
            className="h-12 rounded-lg font-heading font-semibold text-sm text-primary-foreground bg-primary hover:brightness-110 active:scale-[0.98] transition-all duration-150 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Buy for $${product.price}`
            )}
          </button>
        </div>
      </div>

      {/* Sticky buy bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
          <div className="max-w-[480px] mx-auto px-4 pb-4">
            <div className="bg-card rounded-xl p-3.5 store-shadow border border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-lg">{product.emoji}</span>
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-sm text-foreground truncate">{product.name}</p>
                  <p className="font-heading font-bold text-sm" style={{ color: store.accent_color }}>
                    ${product.price}
                  </p>
                </div>
              </div>
              <button
                onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="h-10 px-5 rounded-lg font-heading font-semibold text-sm text-primary-foreground bg-primary hover:brightness-110 active:scale-[0.98] transition-all shrink-0"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
