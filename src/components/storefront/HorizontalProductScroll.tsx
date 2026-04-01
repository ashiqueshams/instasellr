import { Product, Store } from "@/data/sampleData";
import ProductQuantityControl from "./ProductQuantityControl";
import { ChevronRight } from "lucide-react";

interface HorizontalProductScrollProps {
  title: string;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  store: Store;
  onSeeAll?: () => void;
}

export default function HorizontalProductScroll({
  title,
  products,
  onSelectProduct,
  store,
  onSeeAll,
}: HorizontalProductScrollProps) {
  const accentColor = store.accent_color || "#ff4545";

  if (products.length === 0) return null;

  return (
    <div className="animate-fadeUp" style={{ opacity: 0, animationFillMode: "forwards" }}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-bold text-lg" style={{ color: store.text_color || undefined }}>
          {title}
        </h2>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="flex items-center gap-0.5 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: accentColor }}
          >
            See All
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            className="flex-shrink-0 w-[160px] snap-start animate-fadeUp"
            style={{
              animationDelay: `${0.05 + index * 0.05}s`,
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            <button
              onClick={() => onSelectProduct(product)}
              className="w-full rounded-2xl overflow-hidden bg-card group transition-all duration-200 hover:shadow-lg text-left"
            >
              {/* Image */}
              <div className="w-full aspect-[4/5] relative overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-4xl"
                    style={{ backgroundColor: product.color + "18" }}
                  >
                    {product.emoji}
                  </div>
                )}

                {/* Out of stock */}
                {product.product_type === "physical" && product.stock_quantity === 0 && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <span className="bg-destructive text-destructive-foreground text-[9px] font-semibold px-2 py-0.5 rounded-full">Out of Stock</span>
                  </div>
                )}

                {/* Discount badge */}
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}% OFF
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

                {!(product.product_type === "physical" && product.stock_quantity === 0) && (
                  <div className="absolute bottom-1.5 right-1.5 z-10" onClick={(e) => e.stopPropagation()}>
                    <ProductQuantityControl product={product} accentColor={accentColor} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-2.5">
                <h3 className="font-heading font-semibold text-[12px] leading-tight truncate" style={{ color: store.text_color || undefined }}>
                  {product.name}
                </h3>
                <p className="text-[10px] mt-0.5 text-muted-foreground truncate">{product.tagline}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="font-heading font-bold text-xs" style={{ color: accentColor }}>
                    ৳{product.price}
                  </span>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="text-[10px] text-muted-foreground line-through">৳{product.compare_at_price}</span>
                  )}
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
