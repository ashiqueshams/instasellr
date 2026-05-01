import { Lang, t } from "@/lib/onboardingCopy";
import { OnboardingData } from "@/pages/Onboarding";
import StepFooter from "./StepFooter";
import { Check, Loader2 } from "lucide-react";

interface Props {
  lang: Lang;
  data: OnboardingData;
  onBack: () => void;
  onPublish: () => void;
  publishing: boolean;
}

export default function StepReview({ lang, data, onBack, onPublish, publishing }: Props) {
  const initials = data.storeName.trim().slice(0, 2).toUpperCase() || "ST";

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right break-words">{value}</span>
    </div>
  );

  return (
    <div className="animate-fadeUp">
      <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground mb-2">{t("reviewTitle", lang)}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t("reviewSubtitle", lang)}</p>

      {/* Store header preview */}
      <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 store-shadow mb-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center font-heading font-bold text-xl text-white shrink-0 overflow-hidden"
          style={{ backgroundColor: data.accentColor }}
        >
          {data.logoUrl ? <img src={data.logoUrl} alt="" className="w-full h-full object-cover" /> : initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading font-bold text-base text-foreground truncate">{data.storeName}</p>
          <p className="text-xs text-muted-foreground truncate">instasellr.app/store/{data.slug}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-border bg-card p-4 store-shadow mb-4">
        <Row label={t("storeName", lang)} value={data.storeName} />
        <Row label={t("storeUrl", lang)} value={`/${data.slug}`} />
        <Row
          label={t("productTitle", lang)}
          value={`${data.product.name} — ৳${data.product.price}`}
        />
        <Row
          label={t("deliveryTitle", lang)}
          value={
            <span className="block">
              {data.deliveryOptions
                .filter((o) => o.label.trim())
                .map((o, i) => (
                  <span key={i} className="block">
                    {o.label} — {parseFloat(o.cost) > 0 ? `৳${o.cost}` : "Free"}
                  </span>
                ))}
            </span>
          }
        />
        <Row
          label={t("paymentTitle", lang)}
          value={
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <Check className="w-3.5 h-3.5" /> {t("cod", lang)}
            </span>
          }
        />
      </div>

      <button
        onClick={onPublish}
        disabled={publishing}
        className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-heading font-bold text-base hover:bg-primary/90 transition-colors shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {publishing ? <Loader2 className="w-5 h-5 animate-spin" /> : t("finish", lang)}
      </button>

      <div className="h-4" />
      <StepFooter lang={lang} onBack={onBack} onNext={onPublish} nextLabel={t("finish", lang)} loading={publishing} />
    </div>
  );
}
