import { ChevronRight } from "lucide-react";
import { Product } from "@/data/sampleData";

interface ProductListProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  layout?: string;
}

export default function ProductList({ products, onSelectProduct, layout = "list" }: ProductListProps) {
  if (layout === "grid") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {products.map((product, index) => (
          <button
            key={product.id}
            onClick={() => onSelectProduct(product)}
            className="w-full bg-card rounded-xl p-4 store-shadow flex flex-col items-center gap-2 text-center hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150 animate-fadeUp"
            style={{
              animationDelay: `${0.2 + index * 0.07}s`,
              opacity: 0,
              animationFillMode: "forwards",
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
              <h3 className="font-heading font-semibold text-sm text-foreground">{product.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{product.tagline}</p>
            </div>
            <span className="font-heading font-bold text-sm text-foreground">${product.price}</span>
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
          className="w-full bg-card rounded-xl p-4 store-shadow flex items-center gap-3.5 text-left hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150 animate-fadeUp"
          style={{
            animationDelay: `${0.2 + index * 0.07}s`,
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
          ) : (
            <span
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: product.color + "20" }}
            >
              {product.emoji}
            </span>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-sm text-foreground">{product.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{product.tagline}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-heading font-bold text-sm text-foreground">${product.price}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </button>
      ))}
    </div>
  );
}
