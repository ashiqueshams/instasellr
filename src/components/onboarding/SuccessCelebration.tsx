import { useEffect, useState } from "react";
import { Lang, t } from "@/lib/onboardingCopy";
import { Copy, Check, MessageCircle, Facebook } from "lucide-react";

interface Props {
  lang: Lang;
  slug: string;
  onContinue: () => void;
}

export default function SuccessCelebration({ lang, slug, onContinue }: Props) {
  const [copied, setCopied] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);

  const url = `${window.location.origin}/store/${slug}`;

  useEffect(() => {
    setConfettiKey(Date.now());
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const shareWa = () => {
    const msg = encodeURIComponent(`${url}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };
  const shareFb = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Confetti */}
      <div key={confettiKey} className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => {
          const left = (i * 97) % 100;
          const delay = (i % 10) * 0.15;
          const colors = ["#ff4545", "#6C5CE7", "#00B894", "#FDCB6E", "#0984E3"];
          const color = colors[i % colors.length];
          const size = 6 + (i % 4) * 2;
          return (
            <span
              key={i}
              className="absolute top-0 rounded-sm"
              style={{
                left: `${left}%`,
                width: size,
                height: size,
                backgroundColor: color,
                animation: `confettiFall 2.5s ${delay}s ease-out forwards`,
                opacity: 0,
              }}
            />
          );
        })}
      </div>

      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <div className="relative w-full max-w-sm flex flex-col items-center text-center animate-fadeUp">
        <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white">
            <Check className="w-8 h-8" strokeWidth={3} />
          </div>
        </div>

        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground mb-2">
          {t("successTitle", lang)}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">{t("successSubtitle", lang)}</p>

        {/* URL */}
        <div className="w-full bg-card border border-border rounded-xl p-3 flex items-center gap-2 mb-3 store-shadow">
          <span className="flex-1 text-xs font-mono text-foreground truncate">{url}</span>
          <button
            onClick={copy}
            className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? t("copied", lang) : t("copyLink", lang)}
          </button>
        </div>

        {/* Share */}
        <div className="w-full grid grid-cols-2 gap-2 mb-5">
          <button
            onClick={shareWa}
            className="h-11 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
          <button
            onClick={shareFb}
            className="h-11 rounded-xl bg-[#1877F2] text-white text-sm font-semibold hover:bg-[#1877F2]/90 transition-colors flex items-center justify-center gap-2"
          >
            <Facebook className="w-4 h-4" />
            Facebook
          </button>
        </div>

        {/* Test order note */}
        <div className="w-full rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs text-foreground mb-6 leading-relaxed">
          🎁 {t("testOrderNote", lang)}
        </div>

        <button
          onClick={onContinue}
          className="w-full h-12 rounded-xl bg-foreground text-background font-heading font-semibold text-sm hover:bg-foreground/90 transition-colors"
        >
          {t("goDashboard", lang)}
        </button>
      </div>
    </div>
  );
}
