import { ChevronRight } from "lucide-react";
import { Product, Store } from "@/data/sampleData";

interface ProductListProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  layout?: string;
  cardStyle?: string;
  store?: Store;
}

export default function ProductList({ products, onSelectProduct, layout = "list", cardStyle = "card", store }: ProductListProps) {
  const textColor = store?.text_color || undefined;

  if (layout === "grid") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {products.map((product, index) => (
          <button
            key={product.id}
            onClick={() => onSelectProduct(product)}
            className={getCardClasses("grid", cardStyle)}
            style={{
              animationDelay: `${0.2 + index * 0.07}s`,
              opacity: 0,
              animationFillMode: "forwards",
              ...getCardInlineStyle(cardStyle, store),
            }}
          >
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <span
                className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: product.color + "20" }}
              >
                {product.emoji}
              </span>
            )}
            <div>
              <h3 className="font-heading font-semibold text-sm" style={{ color: textColor }}>{product.name}</h3>
              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: textColor ? `${textColor}99` : undefined }}>{product.tagline}</p>
            </div>
            <span className="font-heading font-bold text-sm" style={{ color: textColor }}>${product.price}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {products.map((product, index) => (
        <button
          key={product.id}
          onClick={() => onSelectProduct(product)}
          className={getCardClasses("list", cardStyle)}
          style={{
            animationDelay: `${0.2 + index * 0.07}s`,
            opacity: 0,
            animationFillMode: "forwards",
            ...getCardInlineStyle(cardStyle, store),
          }}
        >
          {cardStyle !== "pill" && (
            product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
            ) : (
              <span
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: product.color + "20" }}
              >
                {product.emoji}
              </span>
            )
          )}

          {cardStyle === "pill" && !product.image_url && (
            <span className="text-xl shrink-0 ml-1">{product.emoji}</span>
          )}
          {cardStyle === "pill" && product.image_url && (
            <img src={product.image_url} alt={product.name} className="w-8 h-8 rounded-full object-cover shrink-0 ml-1" />
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-sm" style={{ color: textColor }}>{product.name}</h3>
            {cardStyle !== "pill" && (
              <p className="text-xs mt-0.5 truncate" style={{ color: textColor ? `${textColor}99` : undefined }}>{product.tagline}</p>
            )}
          </div>

          {cardStyle !== "pill" && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-heading font-bold text-sm" style={{ color: textColor }}>${product.price}</span>
              <ChevronRight className="w-4 h-4" style={{ color: textColor ? `${textColor}66` : undefined }} />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

function getCardClasses(layout: string, cardStyle: string): string {
  const base = "animate-fadeUp transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]";

  if (cardStyle === "pill") {
    return `${base} w-full rounded-full px-5 py-4 flex items-center gap-3 text-left`;
  }
  if (cardStyle === "outlined") {
    return `${base} w-full rounded-xl px-5 py-4 flex ${layout === "grid" ? "flex-col items-center gap-2 text-center" : "items-center gap-3.5 text-left"} border-2`;
  }
  // card (default)
  return `${base} w-full bg-card rounded-xl p-4 store-shadow flex ${layout === "grid" ? "flex-col items-center gap-2 text-center" : "items-center gap-3.5 text-left"}`;
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
