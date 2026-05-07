import { Product, Store } from "@/data/sampleData";
import ProductQuantityControl from "./ProductQuantityControl";

interface ProductListProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  layout?: string;
  cardStyle?: string;
  store?: Store;
  isNew?: (p: Product) => boolean;
}

export default function ProductList({ products, onSelectProduct, layout = "grid", cardStyle = "card", store, isNew }: ProductListProps) {
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

            {/* Out of stock overlay */}
            {product.product_type === "physical" && product.stock_quantity === 0 && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <span className="bg-destructive text-destructive-foreground text-xs font-semibold px-3 py-1 rounded-full">Out of Stock</span>
              </div>
            )}

            {/* Discount badge */}
            {product.compare_at_price && product.compare_at_price > product.price && (
              <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}% OFF
              </div>
            )}

            {/* Gradient overlay at bottom of image */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

            {/* Quantity control overlaid on image */}
            {!(product.product_type === "physical" && product.stock_quantity === 0) && (
              <div className="absolute bottom-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                <ProductQuantityControl product={product} accentColor={accentColor} />
              </div>
            )}
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
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-sm" style={{ color: accentColor }}>
                  ${product.price}
                </span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-[11px] text-muted-foreground line-through">${product.compare_at_price}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
