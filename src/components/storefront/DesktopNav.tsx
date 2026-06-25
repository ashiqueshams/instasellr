import { Info, Search, ShoppingBag, Star } from "lucide-react";
import { Store } from "@/data/sampleData";
import { useCart } from "@/contexts/CartContext";

interface DesktopNavProps {
  store: Store;
  search: string;
  onSearchChange: (v: string) => void;
  onInfoClick: () => void;
  onRatingClick: () => void;
  avgRating: number | null;
  reviewCount: number;
}

export default function DesktopNav({
  store,
  search,
  onSearchChange,
  onInfoClick,
  onRatingClick,
  avgRating,
  reviewCount,
}: DesktopNavProps) {
  const { totalItems, setIsOpen } = useCart();
  const accent = store.accent_color;
  const textColor = store.text_color || undefined;

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/85 border-b border-border/60">
      <div className="max-w-7xl mx-auto h-16 px-8 flex items-center gap-6">
        {/* Logo + name + info */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden font-heading font-bold text-white shadow-sm shrink-0"
            style={{ backgroundColor: accent }}
          >
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm">{store.avatar_initials}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <h1
              className="font-heading font-bold text-base truncate"
              style={{ fontFamily: `'${store.font_heading}', sans-serif`, color: textColor }}
            >
              {store.name}
            </h1>
            <button
              onClick={onInfoClick}
              aria-label="Seller information"
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-auto relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products..."
            className="w-full h-10 pl-10 pr-4 rounded-full bg-muted/60 text-sm border border-transparent focus:border-border focus:bg-white outline-none transition-all"
          />
        </div>

        {/* Rating + cart */}
        <div className="flex items-center gap-2 shrink-0">
          {avgRating !== null && (
            <button
              onClick={onRatingClick}
              className="hidden xl:flex items-center gap-1.5 h-10 px-3 rounded-full hover:bg-muted/60 transition-colors"
            >
              <Star className="w-4 h-4 fill-current" style={{ color: accent }} />
              <span className="text-sm font-semibold" style={{ color: textColor }}>
                {avgRating.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">({reviewCount})</span>
            </button>
          )}
          <button
            onClick={() => setIsOpen(true)}
            className="relative h-10 px-4 rounded-full flex items-center gap-2 text-white text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
            style={{ backgroundColor: accent }}
          >
            <ShoppingBag className="w-4 h-4" />
            Cart
            {totalItems > 0 && (
              <span className="ml-1 min-w-5 h-5 px-1.5 rounded-full bg-white/25 flex items-center justify-center text-[11px] font-bold">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
