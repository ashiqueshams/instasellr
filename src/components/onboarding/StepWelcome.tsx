import { Lang, t } from "@/lib/onboardingCopy";

interface Props {
  lang: Lang;
  onLang: (l: Lang) => void;
  onNext: () => void;
}

export default function StepWelcome({ lang, onNext }: Props) {
  return (
    <div className="flex flex-col items-center text-center pt-6 sm:pt-12 animate-fadeUp">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-4xl mb-6 shadow-lg">
        🎉
      </div>
      <h1 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-3 leading-tight">
        {t("welcomeTitle", lang)}
      </h1>
      <p className="text-muted-foreground text-base mb-8 max-w-sm">
        {t("welcomeSubtitle", lang)}
      </p>

      <div className="w-full max-w-sm flex flex-col gap-2.5 mb-10">
        {(["welcomePromise1", "welcomePromise2", "welcomePromise3"] as const).map((k) => (
          <div key={k} className="bg-card border border-border rounded-xl p-3.5 text-left text-sm font-medium text-foreground store-shadow">
            {t(k, lang)}
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full max-w-sm h-12 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-base hover:bg-primary/90 transition-colors shadow-md"
      >
        {t("welcomeCta", lang)}
      </button>
    </div>
  );
}
