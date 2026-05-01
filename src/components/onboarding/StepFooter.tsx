import { Lang, t } from "@/lib/onboardingCopy";

interface Props {
  lang: Lang;
  onBack?: () => void;
  onNext: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
}

export default function StepFooter({ lang, onBack, onNext, onSkip, nextLabel, nextDisabled, loading }: Props) {
  return (
    <div className="sticky bottom-0 -mx-4 sm:-mx-6 mt-8 px-4 sm:px-6 py-4 bg-background/95 backdrop-blur border-t border-border flex items-center gap-3">
      {onBack && (
        <button
          onClick={onBack}
          disabled={loading}
          className="h-11 px-4 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          ← {t("back", lang)}
        </button>
      )}
      {onSkip && (
        <button
          onClick={onSkip}
          disabled={loading}
          className="h-11 px-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {t("skip", lang)}
        </button>
      )}
      <div className="flex-1" />
      <button
        onClick={onNext}
        disabled={nextDisabled || loading}
        className="flex-1 sm:flex-none h-11 px-6 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {loading ? "..." : (nextLabel ?? t("next", lang))}
      </button>
    </div>
  );
}
