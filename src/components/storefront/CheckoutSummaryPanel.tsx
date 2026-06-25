import { ArrowLeft, ShieldCheck, RotateCcw, Headphones } from "lucide-react";
import { Store } from "@/data/sampleData";
import { useCart } from "@/contexts/CartContext";

interface CheckoutSummaryPanelProps {
  store: Store;
  grandTotal: number;
  discountAmount: number;
  discountLabel?: string | null;
  deliveryCost: number;
  showDelivery: boolean;
  onBack: () => void;
}

// Choose readable foreground for the accent background.
function isLight(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.7;
}

export default function CheckoutSummaryPanel({
  store,
  grandTotal,
  discountAmount,
  discountLabel,
  deliveryCost,
  showDelivery,
  onBack,
}: CheckoutSummaryPanelProps) {
  const { items, totalPrice } = useCart();
  const accent = store.accent_color;
  const tooLight = isLight(accent);
  const bg = tooLight ? "#111111" : accent;
  const fg = "#ffffff";
  const sub = "rgba(255,255,255,0.72)";
  const divider = "rgba(255,255,255,0.16)";

  return (
    <div
      className="h-full w-full p-10 xl:p-14 flex flex-col"
      style={{ backgroundColor: bg, color: fg }}
    >
      {/* Back + logo */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {store.name}
      </button>

      <div className="mt-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/15 flex items-center justify-center font-heading font-bold">
          {store.logo_url ? (
            <img src={store.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm">{store.avatar_initials}</span>
          )}
        </div>
        <span
          className="font-heading font-bold text-lg"
          style={{ fontFamily: `'${store.font_heading}', sans-serif` }}
        >
          {store.name}
        </span>
      </div>

      {/* Summary */}
      <div className="mt-10 flex-1 min-h-0 overflow-y-auto pr-1">
        <p className="text-xs uppercase tracking-wider" style={{ color: sub }}>
          Order summary
        </p>

        <div className="mt-5 flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/10 shrink-0 relative">
                {item.product.image_url ? (
                  <img src={item.product.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">{item.product.emoji}</div>
                )}
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 text-[10px] font-bold bg-white text-black rounded-full flex items-center justify-center">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm truncate">{item.product.name}</p>
                <p className="text-xs" style={{ color: sub }}>
                  ৳{item.product.price.toFixed(2)} each
                </p>
              </div>
              <span className="font-heading font-semibold text-sm">
                ৳{(item.product.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 space-y-2.5 text-sm" style={{ borderTop: `1px solid ${divider}` }}>
          <Row label="Subtotal" value={`৳${totalPrice.toFixed(2)}`} sub={sub} />
          {showDelivery && (
            <Row label="Delivery" value={deliveryCost > 0 ? `৳${deliveryCost.toFixed(2)}` : "Free"} sub={sub} />
          )}
          {discountAmount > 0 && (
            <Row label={discountLabel || "Discount"} value={`−৳${discountAmount.toFixed(2)}`} sub={sub} highlight />
          )}
        </div>

        <div
          className="mt-5 pt-5 flex items-center justify-between"
          style={{ borderTop: `1px solid ${divider}` }}
        >
          <span className="font-heading font-semibold text-base">Total</span>
          <span className="font-heading font-bold text-2xl">৳{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Trust badges */}
      <div className="mt-10 grid grid-cols-3 gap-3 text-[11px]" style={{ color: sub }}>
        <Trust icon={<ShieldCheck className="w-4 h-4" />} label="Secure checkout" />
        <Trust icon={<RotateCcw className="w-4 h-4" />} label="Easy returns" />
        <Trust icon={<Headphones className="w-4 h-4" />} label="Real support" />
      </div>
    </div>
  );
}

function Row({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: sub }}>{label}</span>
      <span className={highlight ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}

function Trust({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      {icon}
      <span>{label}</span>
    </div>
  );
}
