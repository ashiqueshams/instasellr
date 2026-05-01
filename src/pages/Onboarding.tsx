import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthGuard";
import { Loader2, Check } from "lucide-react";
import { Lang, t } from "@/lib/onboardingCopy";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/imageUpload";

import StepWelcome from "@/components/onboarding/StepWelcome";
import StepStoreBasics from "@/components/onboarding/StepStoreBasics";
import StepBranding from "@/components/onboarding/StepBranding";
import StepFirstProduct from "@/components/onboarding/StepFirstProduct";
import StepDelivery from "@/components/onboarding/StepDelivery";
import StepPayment from "@/components/onboarding/StepPayment";
import StepReview from "@/components/onboarding/StepReview";
import SuccessCelebration from "@/components/onboarding/SuccessCelebration";

export interface OnboardingData {
  storeName: string;
  slug: string;
  bio: string;
  logoFile: File | null;
  logoUrl: string | null;
  accentColor: string;
  product: {
    name: string;
    price: string;
    photoFile: File | null;
    photoUrl: string | null;
    material: string;
    care: string;
  };
  deliveryOptions: { label: string; cost: string }[];
  codEnabled: boolean;
}

const TOTAL_STEPS = 6; // 1..6 (Welcome is step 0)

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [storeId, setStoreId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<Lang>("en");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [publishedStoreSlug, setPublishedStoreSlug] = useState<string>("");

  const [data, setData] = useState<OnboardingData>({
    storeName: "",
    slug: "",
    bio: "",
    logoFile: null,
    logoUrl: null,
    accentColor: "#ff4545",
    product: {
      name: "Cotton Kurti",
      price: "1200",
      photoFile: null,
      photoUrl: null,
      material: "100% premium cotton",
      care: "Hand wash only, do not bleach",
    },
    deliveryOptions: [
      { label: lang === "bn" ? "ঢাকার ভিতরে" : "Inside Dhaka", cost: "60" },
      { label: lang === "bn" ? "ঢাকার বাইরে" : "Outside Dhaka", cost: "120" },
    ],
    codEnabled: true,
  });

  // Load existing store / resume
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }

    (async () => {
      const { data: existing } = await supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing && (existing as any).onboarding_completed) {
        navigate("/dashboard?firstTime=false", { replace: true });
        return;
      }

      if (existing) {
        setStoreId(existing.id);
        setStep(Number((existing as any).onboarding_step ?? 0));
        setLang(((existing as any).preferred_language as Lang) ?? "en");
        setData((d) => ({
          ...d,
          storeName: existing.name || "",
          slug: existing.slug || "",
          bio: existing.bio || "",
          logoUrl: existing.logo_url || null,
          accentColor: existing.accent_color || "#ff4545",
        }));
      } else {
        // Create skeleton store
        const baseSlug = (user.email?.split("@")[0] || "my-store")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
        const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "My Store";
        const initials = displayName.slice(0, 2).toUpperCase();

        const { data: created, error } = await supabase
          .from("stores")
          .insert({
            user_id: user.id,
            slug: baseSlug,
            name: displayName,
            avatar_initials: initials,
          } as any)
          .select()
          .single();

        if (error || !created) {
          toast({ title: "Couldn't start onboarding", description: error?.message, variant: "destructive" });
          return;
        }
        setStoreId(created.id);
        setData((d) => ({ ...d, storeName: created.name, slug: created.slug }));
      }

      setLoading(false);
    })();
  }, [user, authLoading, navigate, toast]);

  // Persist progress lightly
  const saveProgress = async (nextStep: number, patch?: Partial<{ name: string; slug: string; bio: string; accent_color: string; logo_url: string | null; preferred_language: Lang }>) => {
    if (!storeId) return;
    await supabase
      .from("stores")
      .update({ onboarding_step: nextStep, ...(patch || {}) } as any)
      .eq("id", storeId);
  };

  const handleLangChange = async (l: Lang) => {
    setLang(l);
    if (storeId) {
      await supabase.from("stores").update({ preferred_language: l } as any).eq("id", storeId);
    }
  };

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  // ===== Step submit handlers =====

  const submitBasics = async () => {
    if (!data.storeName.trim() || !data.slug.trim()) {
      toast({ title: lang === "bn" ? "নাম ও লিংক আবশ্যক" : "Name and URL are required", variant: "destructive" });
      return;
    }
    const cleanSlug = data.slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Slug uniqueness check
    const { data: clash } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", cleanSlug)
      .neq("id", storeId!)
      .maybeSingle();
    if (clash) {
      toast({ title: lang === "bn" ? "এই লিংকটি ইতিমধ্যেই ব্যবহৃত" : "That URL is taken", description: lang === "bn" ? "আরেকটি চেষ্টা করুন" : "Please try another", variant: "destructive" });
      return;
    }

    const initials = data.storeName.trim().slice(0, 2).toUpperCase();
    await supabase
      .from("stores")
      .update({ name: data.storeName.trim(), slug: cleanSlug, bio: data.bio.trim(), avatar_initials: initials } as any)
      .eq("id", storeId!);
    setData((d) => ({ ...d, slug: cleanSlug }));
    await saveProgress(2);
    goNext();
  };

  const submitBranding = async () => {
    let logoUrl = data.logoUrl;
    if (data.logoFile) {
      const uploaded = await uploadImage(data.logoFile, "logos");
      if (uploaded) logoUrl = uploaded;
    }
    await supabase
      .from("stores")
      .update({ logo_url: logoUrl, accent_color: data.accentColor } as any)
      .eq("id", storeId!);
    setData((d) => ({ ...d, logoUrl, logoFile: null }));
    await saveProgress(3);
    goNext();
  };

  const submitProduct = async () => {
    if (!data.product.name.trim() || !data.product.price.trim()) {
      toast({ title: lang === "bn" ? "নাম ও দাম আবশ্যক" : "Name and price are required", variant: "destructive" });
      return;
    }
    let photoUrl = data.product.photoUrl;
    if (data.product.photoFile) {
      const uploaded = await uploadImage(data.product.photoFile, "products");
      if (uploaded) photoUrl = uploaded;
    }
    setData((d) => ({ ...d, product: { ...d.product, photoUrl, photoFile: null } }));
    await saveProgress(4);
    goNext();
  };

  const submitDelivery = async () => {
    const valid = data.deliveryOptions.filter((o) => o.label.trim());
    if (valid.length === 0) {
      toast({ title: lang === "bn" ? "অন্তত ১টি ডেলিভারি অপশন দিন" : "Add at least 1 delivery option", variant: "destructive" });
      return;
    }
    await saveProgress(5);
    goNext();
  };

  const submitPayment = async () => {
    if (!data.codEnabled) {
      toast({ title: lang === "bn" ? "অন্তত ১টি পেমেন্ট মেথড চালু রাখুন" : "Keep at least 1 payment method on", variant: "destructive" });
      return;
    }
    await saveProgress(6);
    goNext();
  };

  const handlePublish = async () => {
    if (!storeId) return;
    setPublishing(true);
    try {
      // 1. Insert product
      const { data: product, error: pErr } = await supabase
        .from("products")
        .insert({
          store_id: storeId,
          name: data.product.name.trim(),
          price: parseFloat(data.product.price) || 0,
          image_url: data.product.photoUrl,
          material: data.product.material.trim(),
          care_instructions: data.product.care.trim(),
          product_type: "physical",
          is_active: true,
        } as any)
        .select()
        .single();
      if (pErr || !product) throw pErr || new Error("Product create failed");

      // 2. Insert delivery options
      const validOpts = data.deliveryOptions.filter((o) => o.label.trim());
      if (validOpts.length > 0) {
        await supabase.from("delivery_options" as any).insert(
          validOpts.map((o, i) => ({
            store_id: storeId,
            label: o.label.trim(),
            cost: parseFloat(o.cost) || 0,
            position: i,
          })) as any,
        );
      }

      // 3. Seed a TEST order so vendor sees what real orders look like
      const cheapest = validOpts.length
        ? Math.min(...validOpts.map((o) => parseFloat(o.cost) || 0))
        : 0;
      const productPrice = parseFloat(data.product.price) || 0;
      await supabase.from("orders").insert({
        store_id: storeId,
        product_id: product.id,
        customer_name: lang === "bn" ? "ডেমো কাস্টমার (টেস্ট)" : "Demo Customer (Test)",
        customer_email: "test@example.com",
        customer_phone: "01700000000",
        shipping_address: lang === "bn" ? "১২৩ ডেমো রোড" : "123 Demo Road",
        shipping_city: "Dhaka",
        amount: productPrice + cheapest,
        status: "pending",
        payment_method: "cod",
        order_items: [
          {
            product: { ...product, image_url: data.product.photoUrl },
            quantity: 1,
          },
        ],
      } as any);

      // 4. Mark onboarding complete
      const { data: storeRow } = await supabase
        .from("stores")
        .update({ onboarding_completed: true, onboarding_step: TOTAL_STEPS } as any)
        .eq("id", storeId)
        .select("slug")
        .single();

      setPublishedStoreSlug(storeRow?.slug || data.slug);
      setShowSuccess(true);
    } catch (e: any) {
      toast({ title: "Publish failed", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveExit = async () => {
    await saveProgress(step);
    navigate("/auth");
    await supabase.auth.signOut();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (showSuccess) {
    return (
      <SuccessCelebration
        lang={lang}
        slug={publishedStoreSlug}
        onContinue={() => navigate("/dashboard?firstTime=true", { replace: true })}
      />
    );
  }

  const progressPct = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">I</div>
            <span className="font-heading font-bold text-sm truncate">InstaSellr</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <div className="flex items-center bg-muted rounded-lg p-0.5 text-xs font-medium">
              <button
                onClick={() => handleLangChange("en")}
                className={`px-2.5 h-7 rounded-md transition-colors ${lang === "en" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                EN
              </button>
              <button
                onClick={() => handleLangChange("bn")}
                className={`px-2.5 h-7 rounded-md transition-colors ${lang === "bn" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                বাংলা
              </button>
            </div>
            {step > 0 && (
              <button
                onClick={handleSaveExit}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
              >
                {t("saveExit", lang)}
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {step > 0 && (
          <div className="max-w-xl mx-auto px-4 sm:px-6 pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">
                {t("stepOf", lang)} {step} {t("of", lang)} {TOTAL_STEPS}
              </span>
              <span className="text-[11px] text-muted-foreground">{Math.round(progressPct)}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Step content */}
      <div className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {step === 0 && <StepWelcome lang={lang} onLang={handleLangChange} onNext={() => { saveProgress(1); goNext(); }} />}
        {step === 1 && <StepStoreBasics lang={lang} data={data} setData={setData} onBack={goBack} onNext={submitBasics} />}
        {step === 2 && <StepBranding lang={lang} data={data} setData={setData} onBack={goBack} onNext={submitBranding} onSkip={() => { saveProgress(3); goNext(); }} />}
        {step === 3 && <StepFirstProduct lang={lang} data={data} setData={setData} onBack={goBack} onNext={submitProduct} />}
        {step === 4 && <StepDelivery lang={lang} data={data} setData={setData} onBack={goBack} onNext={submitDelivery} />}
        {step === 5 && <StepPayment lang={lang} data={data} setData={setData} onBack={goBack} onNext={submitPayment} />}
        {step === 6 && <StepReview lang={lang} data={data} onBack={goBack} onPublish={handlePublish} publishing={publishing} />}
      </div>
    </div>
  );
}

// Re-export so child step components share the type easily
export { TOTAL_STEPS };
