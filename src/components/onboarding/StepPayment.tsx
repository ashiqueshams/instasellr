import { Lang, t } from "@/lib/onboardingCopy";
import { OnboardingData } from "@/pages/Onboarding";
import StepFooter from "./StepFooter";
import { Wallet, Lock } from "lucide-react";

interface Props {
  lang: Lang;
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  onBack: () => void;
  onNext: () => void;
}

export default function StepPayment({ lang, data, setData, onBack, onNext }: Props) {
  return (
    <div className="animate-fadeUp">
      <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground mb-2">{t("paymentTitle", lang)}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t("paymentSubtitle", lang)}</p>

      <button
        onClick={() => setData((d) => ({ ...d, codEnabled: !d.codEnabled }))}
        className={`w-full text-left rounded-xl border-2 p-4 flex items-start gap-3 transition-all ${
          data.codEnabled ? "border-primary bg-primary/5" : "border-border bg-card hover:border-foreground/20"
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${data.codEnabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          <Wallet className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-heading font-semibold text-sm text-foreground">{t("cod", lang)}</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
              {t("recommended", lang).toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{t("codDesc", lang)}</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${data.codEnabled ? "border-primary bg-primary" : "border-border"}`}>
          {data.codEnabled && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
        </div>
      </button>

      <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4 flex items-center gap-3 opacity-70">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground flex-1">{t("bkashSoon", lang)}</p>
      </div>

      <StepFooter lang={lang} onBack={onBack} onNext={onNext} />
    </div>
  );
}
