import { Lang, t } from "@/lib/onboardingCopy";
import { OnboardingData } from "@/pages/Onboarding";
import StepFooter from "./StepFooter";
import { Trash2 } from "lucide-react";

interface Props {
  lang: Lang;
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  onBack: () => void;
  onNext: () => void;
}

const inputClass =
  "h-11 rounded-lg bg-background px-3.5 text-[16px] sm:text-sm font-body border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-muted-foreground w-full";

export default function StepDelivery({ lang, data, setData, onBack, onNext }: Props) {
  const update = (i: number, key: "label" | "cost", val: string) => {
    setData((d) => ({
      ...d,
      deliveryOptions: d.deliveryOptions.map((o, idx) => (idx === i ? { ...o, [key]: val } : o)),
    }));
  };

  const remove = (i: number) => {
    setData((d) => ({ ...d, deliveryOptions: d.deliveryOptions.filter((_, idx) => idx !== i) }));
  };

  const add = () => {
    setData((d) => ({ ...d, deliveryOptions: [...d.deliveryOptions, { label: "", cost: "" }] }));
  };

  return (
    <div className="animate-fadeUp">
      <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground mb-2">{t("deliveryTitle", lang)}</h1>
      <p className="text-sm text-muted-foreground mb-5">{t("deliverySubtitle", lang)}</p>

      <div className="flex flex-col gap-3 mb-4">
        {data.deliveryOptions.map((opt, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3 flex flex-col sm:flex-row gap-2 store-shadow">
            <input
              value={opt.label}
              onChange={(e) => update(i, "label", e.target.value)}
              placeholder={t("deliveryLabel", lang)}
              className={`${inputClass} flex-1`}
            />
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={opt.cost}
                onChange={(e) => update(i, "cost", e.target.value)}
                placeholder={t("deliveryCost", lang)}
                className={`${inputClass} sm:w-28`}
                min="0"
              />
              <button
                onClick={() => remove(i)}
                className="w-11 h-11 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={add}
        className="h-11 px-4 rounded-lg border border-dashed border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors w-full sm:w-auto"
      >
        {t("addDelivery", lang)}
      </button>

      <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">{t("deliveryWhy", lang)}</p>

      <StepFooter lang={lang} onBack={onBack} onNext={onNext} />
    </div>
  );
}
