import { Product } from "@/data/sampleData";

interface BundleCardProps {
  products: Product[];
  onBuyBundle: () => void;
}

export default function BundleCard({ products, onBuyBundle }: BundleCardProps) {
  const totalPrice = products.reduce((sum, p) => sum + p.price, 0);
  const bundlePrice = Math.round(totalPrice * 0.7);
  const savings = totalPrice - bundlePrice;

  return (
    <div
      className="relative rounded-xl p-5 overflow-hidden animate-fadeUp"
      style={{
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
        animationDelay: "0.15s",
        opacity: 0,
        animationFillMode: "forwards",
      }}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 animate-shimmer pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🔥</span>
          <span className="font-heading font-bold text-gold text-sm tracking-wide uppercase">
            Complete Bundle
          </span>
        </div>
        <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
          Get all {products.length} products and save ${savings}
        </p>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex -space-x-2">
            {products.map((p) => (
              <span
                key={p.id}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2"
                style={{ backgroundColor: p.color, borderColor: "#1a1a1a" }}
              >
                {p.emoji}
              </span>
            ))}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading font-bold text-xl" style={{ color: "#fff" }}>
              ${bundlePrice}
            </span>
            <span className="text-sm line-through" style={{ color: "rgba(255,255,255,0.4)" }}>
              ${totalPrice}
            </span>
          </div>
        </div>

        <button
          onClick={onBuyBundle}
          className="w-full h-11 rounded-lg font-heading font-semibold text-sm bg-gold text-gold-foreground hover:brightness-110 active:scale-[0.98] transition-all duration-150"
        >
          Get the Bundle →
        </button>
      </div>
    </div>
  );
}
