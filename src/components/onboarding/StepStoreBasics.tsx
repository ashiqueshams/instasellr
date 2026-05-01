import { Lang, t } from "@/lib/onboardingCopy";
import { OnboardingData } from "@/pages/Onboarding";
import StepFooter from "./StepFooter";

interface Props {
  lang: Lang;
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  onBack: () => void;
  onNext: () => void;
}

const inputClass =
  "h-11 rounded-lg bg-background px-3.5 text-[16px] sm:text-sm font-body border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-muted-foreground w-full";

export default function StepStoreBasics({ lang, data, setData, onBack, onNext }: Props) {
  const updateSlugFromName = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setData((d) => ({ ...d, storeName: name, slug: d.slug && d.slug !== "" ? d.slug : slug }));
  };

  return (
    <div className="animate-fadeUp">
      <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground mb-2">{t("basicsTitle", lang)}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t("basicsSubtitle", lang)}</p>

      <div className="flex flex-col gap-5">
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
            {t("storeName", lang)} <span className="text-destructive">*</span>
          </label>
          <input
            value={data.storeName}
            onChange={(e) => updateSlugFromName(e.target.value)}
            placeholder={t("storeNamePh", lang)}
            className={inputClass}
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
            {t("storeUrl", lang)} <span className="text-destructive">*</span>
          </label>
          <div className="flex items-center bg-background border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/20">
            <span className="px-3 text-xs text-muted-foreground bg-muted h-11 flex items-center border-r border-border whitespace-nowrap">
              instasellr.app/store/
            </span>
            <input
              value={data.slug}
              onChange={(e) => setData((d) => ({ ...d, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
              placeholder="aarong-boutique"
              className="flex-1 h-11 px-3 text-[16px] sm:text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">{t("storeUrlHint", lang)}</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
            {t("bio", lang)} <span className="text-muted-foreground font-normal">({t("optional", lang)})</span>
          </label>
          <input
            value={data.bio}
            onChange={(e) => setData((d) => ({ ...d, bio: e.target.value }))}
            placeholder={t("bioPh", lang)}
            className={inputClass}
            maxLength={120}
          />
        </div>
      </div>

      <StepFooter lang={lang} onBack={onBack} onNext={onNext} />
    </div>
  );
}
