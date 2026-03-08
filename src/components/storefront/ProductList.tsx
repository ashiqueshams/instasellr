import { ShoppingBag, Package } from "lucide-react";
import { Product, Store } from "@/data/sampleData";
import { useCart } from "@/contexts/CartContext";

interface ProductListProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  layout?: string;
  cardStyle?: string;
  store?: Store;
}

export default function ProductList({ products, onSelectProduct, layout = "list", cardStyle = "card", store }: ProductListProps) {
  const { addToCart } = useCart();
  const textColor = store?.text_color || undefined;
  const accentColor = store?.accent_color || "#ff4545";

  if (layout === "grid") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="animate-fadeUp rounded-2xl overflow-hidden bg-card store-shadow group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            style={{
              animationDelay: `${0.2 + index * 0.07}s`,
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            {/* Image area */}
            <button
              onClick={() => onSelectProduct(product)}
              className="w-full aspect-square relative overflow-hidden bg-muted"
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-4xl"
                  style={{ backgroundColor: product.color + "15" }}
                >
                  {product.emoji}
                </div>
              )}
              {/* Type badge */}
              {product.product_type === "physical" && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-[10px] font-semibold flex items-center gap-1">
                  <Package className="w-3 h-3" /> Physical
                </span>
              )}
            </button>

            {/* Info */}
            <div className="p-3.5">
              <button onClick={() => onSelectProduct(product)} className="text-left w-full">
                <h3 className="font-heading font-semibold text-sm truncate" style={{ color: textColor }}>
                  {product.name}
                </h3>
                <p className="text-xs mt-0.5 line-clamp-1 text-muted-foreground">{product.tagline}</p>
              </button>
              <div className="flex items-center justify-between mt-3">
                <span className="font-heading font-bold text-base" style={{ color: accentColor }}>
                  ${product.price}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-primary-foreground hover:brightness-110 active:scale-90 transition-all"
                  style={{ backgroundColor: accentColor }}
                >
                  <ShoppingBag className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // List layout
  return (
    <div className="flex flex-col gap-3">
      {products.map((product, index) => (
        <div
          key={product.id}
          className={getCardClasses(cardStyle)}
          style={{
            animationDelay: `${0.2 + index * 0.07}s`,
            opacity: 0,
            animationFillMode: "forwards",
            ...getCardInlineStyle(cardStyle, store),
          }}
        >
          {/* Left: image / emoji */}
          <button onClick={() => onSelectProduct(product)} className="shrink-0">
            {cardStyle === "pill" ? (
              product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <span className="text-xl">{product.emoji}</span>
              )
            ) : product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <span
                className="w-14 h-14 rounded-xl flex items-center justify-center text-xl"
                style={{ backgroundColor: product.color + "20" }}
              >
                {product.emoji}
              </span>
            )}
          </button>

          {/* Middle: info */}
          <button onClick={() => onSelectProduct(product)} className="flex-1 min-w-0 text-left">
            <h3 className="font-heading font-semibold text-sm" style={{ color: textColor }}>{product.name}</h3>
            {cardStyle !== "pill" && (
              <p className="text-xs mt-0.5 truncate text-muted-foreground">{product.tagline}</p>
            )}
          </button>

          {/* Right: price + add to cart */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-heading font-bold text-sm" style={{ color: accentColor }}>${product.price}</span>
            <button
              onClick={(e) => { e.stopPropagation(); addToCart(product); }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-primary-foreground hover:brightness-110 active:scale-90 transition-all"
              style={{ backgroundColor: accentColor }}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function getCardClasses(cardStyle: string): string {
  const base = "animate-fadeUp transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3.5 w-full";

  if (cardStyle === "pill") {
    return `${base} rounded-full px-5 py-3.5`;
  }
  if (cardStyle === "outlined") {
    return `${base} rounded-xl px-5 py-4 border-2`;
  }
  return `${base} bg-card rounded-xl p-4 store-shadow`;
}

function getCardInlineStyle(cardStyle: string, store?: Store): React.CSSProperties {
  if (cardStyle === "pill") {
    return {
      backgroundColor: store?.banner_mode === "fullpage" ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.95)",
      backdropFilter: "blur(8px)",
    };
  }
  if (cardStyle === "outlined") {
    return {
      borderColor: store?.accent_color || "#333",
      backgroundColor: "transparent",
    };
  }
  return {};
}
