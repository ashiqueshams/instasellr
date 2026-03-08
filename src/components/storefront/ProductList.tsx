import { ShoppingBag, Plus } from "lucide-react";
import { Product, Store } from "@/data/sampleData";
import { useCart } from "@/contexts/CartContext";

interface ProductListProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  layout?: string;
  cardStyle?: string;
  store?: Store;
}

export default function ProductList({ products, onSelectProduct, layout = "grid", cardStyle = "card", store }: ProductListProps) {
  const { addToCart } = useCart();
  const textColor = store?.text_color || undefined;
  const accentColor = store?.accent_color || "#ff4545";

  return (
    <div className="grid grid-cols-2 gap-3">
      {products.map((product, index) => (
        <div
          key={product.id}
          className="animate-fadeUp rounded-2xl overflow-hidden bg-card group transition-all duration-200 hover:shadow-xl hover:-translate-y-1"
          style={{
            animationDelay: `${0.1 + index * 0.05}s`,
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          {/* Full-bleed product image */}
          <button
            onClick={() => onSelectProduct(product)}
            className="w-full aspect-[4/5] relative overflow-hidden"
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-5xl"
                style={{ backgroundColor: product.color + "18" }}
              >
                {product.emoji}
              </div>
            )}

            {/* Gradient overlay at bottom of image */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
          </button>

          {/* Product info below image */}
          <div className="p-3">
            <button onClick={() => onSelectProduct(product)} className="text-left w-full">
              <h3 className="font-heading font-semibold text-[13px] leading-tight truncate" style={{ color: textColor }}>
                {product.name}
              </h3>
              <p className="text-[11px] mt-0.5 text-muted-foreground truncate">{product.tagline}</p>
            </button>
            <div className="flex items-center justify-between mt-2.5">
              <span className="font-heading font-bold text-sm" style={{ color: accentColor }}>
                ${product.price}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground hover:brightness-110 active:scale-90 transition-all shadow-sm"
                style={{ backgroundColor: accentColor }}
                aria-label={`Add ${product.name} to cart`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
