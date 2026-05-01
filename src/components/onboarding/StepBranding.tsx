import { useRef, useState } from "react";
import { Lang, t } from "@/lib/onboardingCopy";
import { OnboardingData } from "@/pages/Onboarding";
import StepFooter from "./StepFooter";
import { Upload, X } from "lucide-react";

interface Props {
  lang: Lang;
  data: OnboardingData;
  setData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

const PRESET_COLORS = ["#ff4545", "#6C5CE7", "#00B894", "#FDCB6E", "#0984E3", "#1a1a1a"];

export default function StepBranding({ lang, data, setData, onBack, onNext, onSkip }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setData((d) => ({ ...d, logoFile: file, logoUrl: URL.createObjectURL(file) }));
  };

  const initials = data.storeName.trim().slice(0, 2).toUpperCase() || "ST";

  return (
    <div className="animate-fadeUp">
      <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground mb-2">{t("brandingTitle", lang)}</h1>
      <p className="text-sm text-muted-foreground mb-6">{t("brandingSubtitle", lang)}</p>

      {/* Logo */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-foreground mb-2 block">
          {t("logo", lang)} <span className="text-muted-foreground font-normal">({t("optional", lang)})</span>
        </label>

        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center font-heading font-bold text-2xl text-white shadow-md shrink-0 overflow-hidden"
            style={{ backgroundColor: data.accentColor }}
          >
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="logo" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <div className="flex-1">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {t("uploadLogo", lang)}
            </button>
            {data.logoUrl && (
              <button
                onClick={() => setData((d) => ({ ...d, logoFile: null, logoUrl: null }))}
                className="ml-2 h-10 w-10 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors inline-flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <p className="text-[11px] text-muted-foreground mt-2">{t("noLogoFallback", lang)}</p>
          </div>
        </div>
      </div>

      {/* Accent color */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-foreground mb-2 block">{t("accentColor", lang)}</label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setData((d) => ({ ...d, accentColor: c }))}
              className={`w-9 h-9 rounded-full transition-all ${data.accentColor === c ? "ring-2 ring-offset-2 ring-foreground" : "hover:scale-110"}`}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
          <label className="relative w-9 h-9 rounded-full overflow-hidden cursor-pointer border border-border bg-gradient-to-br from-fuchsia-500 via-yellow-400 to-cyan-400">
            <input
              type="color"
              value={data.accentColor}
              onChange={(e) => setData((d) => ({ ...d, accentColor: e.target.value }))}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">{t("accentColorHint", lang)}</p>
      </div>

      {/* Live preview */}
      <div className="mb-2">
        <p className="text-xs font-semibold text-foreground mb-2">{t("livePreview", lang)}</p>
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3 store-shadow">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-heading font-bold text-lg text-white shrink-0 overflow-hidden"
            style={{ backgroundColor: data.accentColor }}
          >
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="logo" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading font-bold text-sm text-foreground truncate">{data.storeName || "Your Store"}</p>
            <p className="text-[11px] text-muted-foreground truncate">{data.bio || "instasellr.app/store/" + data.slug}</p>
          </div>
          <button
            className="h-8 px-3 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: data.accentColor }}
          >
            Shop
          </button>
        </div>
      </div>

      <StepFooter lang={lang} onBack={onBack} onNext={onNext} onSkip={onSkip} loading={uploading} />
    </div>
  );
}
