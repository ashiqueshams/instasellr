import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

interface Spotlight {
  selector: string;
  title: string;
  desc: string;
}

const STORAGE_KEY = "instasellr_tour_done_v1";

export default function CoachMarks() {
  const [params, setParams] = useSearchParams();
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const steps: Spotlight[] = [
    {
      selector: 'a[href="/dashboard"]',
      title: "📦 Your Orders live here",
      desc: "We've added a test order so you can see exactly what real orders look like. Try clicking around — you can delete it anytime.",
    },
    {
      selector: 'a[href="/dashboard/inbox"]',
      title: "💬 Customer DMs land in Inbox",
      desc: "When customers DM you on Instagram or Facebook, the AI auto-replies in Bangla & English. You can take over anytime.",
    },
    {
      selector: 'a[href="/dashboard/products"]',
      title: "🛍️ Add more products",
      desc: "Upload your full catalog here. The more products with material & care info, the smarter your AI chatbot becomes.",
    },
    {
      selector: 'a[href="/dashboard/settings"]',
      title: "⚙️ Final touches in Settings",
      desc: "Connect Pathao courier, set up Meta pixel for ads, customize your storefront theme — all here when you're ready.",
    },
  ];

  useEffect(() => {
    if (params.get("firstTime") !== "true") return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    // Wait one tick for sidebar to render
    const id = setTimeout(() => setActive(true), 400);
    return () => clearTimeout(id);
  }, [params]);

  useEffect(() => {
    if (!active) return;
    const update = () => {
      const el = document.querySelector(steps[stepIdx].selector) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIdx]);

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setActive(false);
    const next = new URLSearchParams(params);
    next.delete("firstTime");
    setParams(next, { replace: true });
  };

  if (!active) return null;

  const step = steps[stepIdx];
  const pad = 8;
  const cardTop = rect ? Math.min(rect.bottom + pad, window.innerHeight - 220) : 80;
  const cardLeft = rect ? Math.max(16, Math.min(rect.left, window.innerWidth - 340)) : 16;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Dim overlay with cutout */}
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={finish} />
      {rect && (
        <div
          className="absolute rounded-xl ring-4 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-all duration-300"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
          }}
        />
      )}

      {/* Card */}
      <div
        className="absolute w-[320px] max-w-[calc(100vw-32px)] bg-card border border-border rounded-2xl p-4 shadow-2xl pointer-events-auto animate-fadeUp"
        style={{ top: cardTop, left: cardLeft }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
            Step {stepIdx + 1} of {steps.length}
          </span>
          <button
            onClick={finish}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>
        </div>
        <h3 className="font-heading font-bold text-base text-foreground mb-1.5">{step.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{step.desc}</p>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 flex-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === stepIdx ? "bg-primary w-6" : i < stepIdx ? "bg-primary/40 w-3" : "bg-muted w-3"
                }`}
              />
            ))}
          </div>
          {stepIdx > 0 && (
            <button
              onClick={() => setStepIdx((s) => s - 1)}
              className="h-8 px-3 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={() => (stepIdx === steps.length - 1 ? finish() : setStepIdx((s) => s + 1))}
            className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            {stepIdx === steps.length - 1 ? "Got it!" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
