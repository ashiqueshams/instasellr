import { useRef } from "react";
import { Lang, t } from "@/lib/onboardingCopy";
import { OnboardingData } from "@/pages/Onboarding";
import StepFooter from "./StepFooter";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface Props {
  lang: Lang;
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  onBack: () => void;
  onNext: () => void;
}

const inputClass =
  "h-11 rounded-lg bg-background px-3.5 text-[16px] sm:text-sm font-body border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-muted-foreground w-full";

export default function StepFirstProduct({ lang, data, setData, onBack, onNext }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setData((d) => ({
      ...d,
      product: { ...d.product, photoFile: file, photoUrl: URL.createObjectURL(file) },
    }));
  };

  return (
    <div className="animate-fadeUp">
      <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground mb-2">{t("productTitle", lang)}</h1>
      <p className="text-sm text-muted-foreground mb-5">{t("productSubtitle", lang)}</p>

      <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs text-foreground mb-5 leading-relaxed">
        {t("productPhotoHint", lang)}
      </div>

      <div className="flex flex-col gap-4">
        {/* Photo */}
        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">{t("productPhoto", lang)}</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] || null)}
          />
          {data.product.photoUrl ? (
            <div className="relative w-full aspect-[5/4] rounded-xl overflow-hidden border border-border bg-muted">
              <img src={data.product.photoUrl} alt="product" className="w-full h-full object-cover" />
              <button
                onClick={() => setData((d) => ({ ...d, product: { ...d.product, photoFile: null, photoUrl: null } }))}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors shadow"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[5/4] rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors"
            >
              <ImageIcon className="w-7 h-7" />
              <span className="text-xs font-medium">{t("uploadLogo", lang).replace("logo", "photo").replace("লোগো", "ছবি")}</span>
            </button>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
            {t("productName", lang)} <span className="text-destructive">*</span>
          </label>
          <input
            value={data.product.name}
            onChange={(e) => setData((d) => ({ ...d, product: { ...d.product, name: e.target.value } }))}
            placeholder={t("productNamePh", lang)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
            {t("productPrice", lang)} <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            inputMode="decimal"
            value={data.product.price}
            onChange={(e) => setData((d) => ({ ...d, product: { ...d.product, price: e.target.value } }))}
            placeholder={t("productPricePh", lang)}
            className={inputClass}
            min="0"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">{t("productMaterial", lang)}</label>
          <input
            value={data.product.material}
            onChange={(e) => setData((d) => ({ ...d, product: { ...d.product, material: e.target.value } }))}
            placeholder={t("productMaterialPh", lang)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1.5 block">{t("productCare", lang)}</label>
          <input
            value={data.product.care}
            onChange={(e) => setData((d) => ({ ...d, product: { ...d.product, care: e.target.value } }))}
            placeholder={t("productCarePh", lang)}
            className={inputClass}
          />
        </div>
      </div>

      <StepFooter lang={lang} onBack={onBack} onNext={onNext} />
    </div>
  );
}
