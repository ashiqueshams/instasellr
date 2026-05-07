import { Category, Product, Store } from "@/data/sampleData";

interface CategoryCardsProps {
  categories: Category[];
  productCounts: Record<string, number>;
  store: Store;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export default function CategoryCards({ categories, productCounts, store, selectedCategoryId, onSelectCategory }: CategoryCardsProps) {
  if (categories.length === 0) return null;
  const accentColor = store.accent_color || "#ff4545";
  const textColor = store.text_color || undefined;

  return (
    <div className="animate-fadeUp" style={{ animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}>
      <h3 className="font-heading font-semibold text-sm mb-3" style={{ color: textColor }}>
        Shop by Category
      </h3>
      <div className="flex gap-2.5 overflow-x-auto -mx-5 px-5 pb-1 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: "none" }}>
        {categories.map((c) => {
          const isSelected = selectedCategoryId === c.id;
          const count = productCounts[c.id] || 0;
          return (
            <button
              key={c.id}
              onClick={() => onSelectCategory(isSelected ? null : c.id)}
              className="relative rounded-xl overflow-hidden w-28 h-28 flex-shrink-0 snap-start group transition-all duration-200 hover:shadow-lg"
              style={{ outline: isSelected ? `2.5px solid ${accentColor}` : "none", outlineOffset: "-1px" }}
            >
              {c.image_url ? (
                <img src={c.image_url} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-3xl" style={{ backgroundColor: accentColor }}>
                  📦
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2">
                <p className="font-heading font-semibold text-[11px] text-white leading-tight truncate">{c.name}</p>
                <p className="text-[9px] text-white/60">{count} items</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
