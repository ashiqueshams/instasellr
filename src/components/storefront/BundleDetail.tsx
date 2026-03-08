import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Product, Store } from "@/data/sampleData";
import { useToast } from "@/hooks/use-toast";

interface BundleDetailProps {
  products: Product[];
  store: Store;
  onBack: () => void;
}

export default function BundleDetail({ products, store, onBack }: BundleDetailProps) {
  const totalPrice = products.reduce((sum, p) => sum + p.price, 0);
  const bundlePrice = Math.round(totalPrice * 0.7);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setPurchased(true);
  };

  if (purchased) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-popIn">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="font-heading font-bold text-xl text-foreground">Purchase Successful!</h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-[260px]">
          Download links for all {products.length} products have been sent to{" "}
          <span className="font-semibold text-foreground">{email}</span>
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
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Hero */}
      <div
        className="rounded-xl p-6 text-center mb-6 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)" }}
      >
        <div className="absolute inset-0 animate-shimmer pointer-events-none" />
        <div className="relative z-10">
          <div className="flex justify-center gap-2 mb-3">
            {products.map((p) => (
              <span
                key={p.id}
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: p.color }}
              >
                {p.emoji}
              </span>
            ))}
          </div>
          <h2 className="font-heading font-bold text-xl text-gold">Complete Bundle</h2>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            All {products.length} products at 30% off
          </p>
          <div className="flex items-baseline justify-center gap-2 mt-3">
            <span className="font-heading font-bold text-3xl" style={{ color: "#fff" }}>
              ${bundlePrice}
            </span>
            <span className="text-sm line-through" style={{ color: "rgba(255,255,255,0.4)" }}>
              ${totalPrice}
            </span>
          </div>
        </div>
      </div>

      {/* Included products */}
      <div className="mb-6">
        <h3 className="font-heading font-semibold text-sm text-foreground mb-3">What's in the bundle</h3>
        <div className="flex flex-col gap-2.5">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 bg-card rounded-xl p-3.5 store-shadow">
              <span
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: p.color + "20" }}
              >
                {p.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground truncate">{p.tagline}</p>
              </div>
              <span className="text-sm text-muted-foreground line-through">${p.price}</span>
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
            className="h-12 rounded-lg font-heading font-semibold text-sm text-gold-foreground bg-gold hover:brightness-110 active:scale-[0.98] transition-all duration-150 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Get the Bundle — $${bundlePrice}`
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
                <span className="text-lg">🔥</span>
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-sm text-foreground">Complete Bundle</p>
                  <p className="font-heading font-bold text-sm text-gold">${bundlePrice}</p>
                </div>
              </div>
              <button
                onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="h-10 px-5 rounded-lg font-heading font-semibold text-sm text-gold-foreground bg-gold hover:brightness-110 active:scale-[0.98] transition-all shrink-0"
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
