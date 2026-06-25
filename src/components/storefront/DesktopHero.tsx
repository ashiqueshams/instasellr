import { Store, Product } from "@/data/sampleData";
import { SocialIcons } from "./StoreHeader";
import { Tag } from "lucide-react";

interface DesktopHeroProps {
  store: Store;
  productCount: number;
  hasPhysical: boolean;
  avgRating: number | null;
  reviewCount: number;
  featured?: Product | null;
  onFeaturedClick?: (p: Product) => void;
  onRatingClick: () => void;
  referral?: { code: string; influencer_name?: string; discount_percent: number } | null;
}

export default function DesktopHero({
  store,
  productCount,
  hasPhysical,
  avgRating,
  reviewCount,
  featured,
  onFeaturedClick,
  onRatingClick,
  referral,
}: DesktopHeroProps) {
  const accent = store.accent_color;
  const textColor = store.text_color || undefined;

  return (
    <section
      className="rounded-3xl overflow-hidden"
      style={{ backgroundColor: accent + "0F" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-10 p-8 lg:p-10 items-center">
        {/* Identity */}
        <div className="min-w-0">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden font-heading font-bold text-white text-xl shadow-md"
            style={{ backgroundColor: accent }}
          >
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <span>{store.avatar_initials}</span>
            )}
          </div>

          <h2
            className="mt-5 font-heading font-bold text-3xl xl:text-4xl leading-tight"
            style={{ fontFamily: `'${store.font_heading}', sans-serif`, color: textColor }}
          >
            {store.name}
          </h2>
          {store.bio && (
            <p className="mt-3 text-sm xl:text-base text-muted-foreground max-w-md leading-relaxed">
              {store.bio}
            </p>
          )}

          {/* Stats row */}
          <div className="mt-6 flex items-center gap-6">
            <Stat label="Products" value={productCount.toString()} textColor={textColor} />
            <Divider />
            <Stat
              label="Rating"
              value={avgRating ? `${avgRating.toFixed(1)} ★` : "—"}
              sub={reviewCount ? `${reviewCount} review${reviewCount !== 1 ? "s" : ""}` : undefined}
              onClick={avgRating ? onRatingClick : undefined}
              textColor={textColor}
            />
            <Divider />
            <Stat label="Shipping" value={hasPhysical ? "Available" : "Instant"} textColor={textColor} />
          </div>

          {/* Social + referral */}
          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <SocialIcons store={store} />
            {referral && (
              <div
                className="flex items-center gap-2 px-3 h-9 rounded-full"
                style={{ backgroundColor: accent + "18", border: `1px solid ${accent}33` }}
              >
                <Tag className="w-3.5 h-3.5" style={{ color: accent }} />
                <span className="text-xs font-semibold" style={{ color: textColor }}>
                  {referral.discount_percent}% off
                  {referral.influencer_name ? ` via ${referral.influencer_name}` : ""}
                </span>
                <span className="text-[11px] text-muted-foreground">· auto-applied</span>
              </div>
            )}
          </div>
        </div>

        {/* Visual */}
        <div className="relative">
          {store.banner_url ? (
            <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
              <img src={store.banner_url} alt="" className="w-full h-full object-cover" />
            </div>
          ) : featured ? (
            <button
              onClick={() => onFeaturedClick?.(featured)}
              className="group block w-full text-left"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-lg relative">
                {featured.image_url ? (
                  <img
                    src={featured.image_url}
                    alt={featured.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-7xl"
                    style={{ backgroundColor: featured.color + "20" }}
                  >
                    {featured.emoji}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                  <p className="text-white/80 text-xs font-medium uppercase tracking-wider">Featured</p>
                  <p className="text-white font-heading font-bold text-lg mt-1 truncate">{featured.name}</p>
                  <p className="text-white/90 text-sm">৳{featured.price}</p>
                </div>
              </div>
            </button>
          ) : (
            <div
              className="aspect-[4/3] rounded-2xl flex items-center justify-center text-6xl font-bold text-white/90"
              style={{ backgroundColor: accent }}
            >
              {store.avatar_initials}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
  onClick,
  textColor,
}: {
  label: string;
  value: string;
  sub?: string;
  onClick?: () => void;
  textColor?: string;
}) {
  const Comp: any = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`flex flex-col text-left ${onClick ? "cursor-pointer hover:opacity-70 transition-opacity" : ""}`}
    >
      <span className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">{label}</span>
      <span className="text-base font-heading font-bold mt-0.5" style={{ color: textColor }}>
        {value}
      </span>
      {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
    </Comp>
  );
}

function Divider() {
  return <div className="w-px h-9 bg-border/70" />;
}
