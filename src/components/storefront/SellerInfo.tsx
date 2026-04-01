import { Store } from "@/data/sampleData";
import { SocialIcons } from "./StoreHeader";
import { MapPin, Clock, Shield } from "lucide-react";

interface SellerInfoProps {
  store: Store;
}

export default function SellerInfo({ store }: SellerInfoProps) {
  return (
    <div className="animate-fadeUp rounded-2xl bg-card p-5" style={{ opacity: 0, animationFillMode: "forwards" }}>
      <h2 className="font-heading font-bold text-lg mb-4" style={{ color: store.text_color || undefined }}>
        Information
      </h2>

      <div className="flex items-start gap-4 mb-4">
        {/* Seller avatar */}
        <div
          className="w-12 h-12 rounded-[12px] flex-shrink-0 flex items-center justify-center font-heading font-bold text-lg text-white overflow-hidden"
          style={{ backgroundColor: store.accent_color }}
        >
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
          ) : (
            <span>{store.avatar_initials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-sm" style={{ color: store.text_color || undefined }}>
            {store.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{store.bio}</p>
        </div>
      </div>

      {/* Info items */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Shield className="w-4 h-4 flex-shrink-0" style={{ color: store.accent_color }} />
          <span>Verified Seller</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Clock className="w-4 h-4 flex-shrink-0" style={{ color: store.accent_color }} />
          <span>Member since {new Date(store.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
        </div>
      </div>

      {/* Social links */}
      {Object.values(store.social_links).some(Boolean) && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <SocialIcons store={store} />
        </div>
      )}
    </div>
  );
}
