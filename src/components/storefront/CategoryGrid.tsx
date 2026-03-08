import { Product, Store } from "@/data/sampleData";

interface CategoryGridProps {
  products: Product[];
  store: Store;
  onSelectCategory: (category: string) => void;
  selectedCategory: string | null;
}

// Pick a representative image from products in each category
function getCategoryImage(products: Product[]): string | null {
  const withImage = products.find((p) => p.image_url);
  return withImage?.image_url || null;
}

function getCategoryEmoji(products: Product[]): string {
  return products[0]?.emoji || "📦";
}

export default function CategoryGrid({ products, store, onSelectCategory, selectedCategory }: CategoryGridProps) {
  // Build categories from products
  const categoryMap = new Map<string, Product[]>();
  products.forEach((p) => {
    const cat = p.category?.trim() || "Other";
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(p);
  });

  const categories = Array.from(categoryMap.entries());
  if (categories.length <= 1) return null; // Don't show if only one category

  const accentColor = store.accent_color || "#ff4545";
  const textColor = store.text_color || undefined;

  return (
    <div className="animate-fadeUp" style={{ animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>
      <h3 className="font-heading font-semibold text-sm mb-3" style={{ color: textColor }}>
        Shop by Category
      </h3>
      <div className="grid grid-cols-3 gap-2.5">
        {categories.map(([name, catProducts]) => {
          const image = getCategoryImage(catProducts);
          const isSelected = selectedCategory === name;

          return (
            <button
              key={name}
              onClick={() => onSelectCategory(isSelected ? "" : name)}
              className="relative rounded-xl overflow-hidden aspect-square group transition-all duration-200 hover:shadow-lg"
              style={{
                outline: isSelected ? `2.5px solid ${accentColor}` : "none",
                outlineOffset: "-1px",
              }}
            >
              {/* Background */}
              {image ? (
                <img
                  src={image}
                  alt={name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center text-3xl"
                  style={{ backgroundColor: accentColor + "15" }}
                >
                  {getCategoryEmoji(catProducts)}
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Label */}
              <div className="absolute inset-x-0 bottom-0 p-2">
                <p className="font-heading font-semibold text-[11px] text-white leading-tight truncate">
                  {name}
                </p>
                <p className="text-[9px] text-white/60">{catProducts.length} items</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
