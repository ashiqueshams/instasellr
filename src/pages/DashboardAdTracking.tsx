import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, ExternalLink, CheckCircle2, Circle } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/hooks/use-store";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";

type Integrations = {
  meta_pixel_id: string;
  meta_pixel_enabled: boolean;
  meta_capi_token: string;
  meta_capi_enabled: boolean;
  meta_test_event_code: string;
  google_ads_conversion_id: string;
  google_ads_conversion_label: string;
  google_ads_enabled: boolean;
  tiktok_pixel_id: string;
  tiktok_pixel_enabled: boolean;
};

const empty: Integrations = {
  meta_pixel_id: "",
  meta_pixel_enabled: false,
  meta_capi_token: "",
  meta_capi_enabled: false,
  meta_test_event_code: "",
  google_ads_conversion_id: "",
  google_ads_conversion_label: "",
  google_ads_enabled: false,
  tiktok_pixel_id: "",
  tiktok_pixel_enabled: false,
};

const inputClass =
  "h-11 rounded-lg bg-background px-3.5 text-[16px] sm:text-sm font-body border border-border outline-none focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-muted-foreground w-full";

function StatusBadge({ active, configured }: { active: boolean; configured: boolean }) {
  if (active && configured) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-body font-medium text-green-600">
        <CheckCircle2 className="w-3.5 h-3.5" /> Connected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-body font-medium text-muted-foreground">
      <Circle className="w-3.5 h-3.5" /> Not configured
    </span>
  );
}

function maskToken(token: string) {
  if (!token) return "";
  if (token.length <= 4) return "••••";
  return `••••••••••${token.slice(-4)}`;
}

export default function DashboardAdTracking() {
  const { toast } = useToast();
  const { store, loading } = useStore();
  const [form, setForm] = useState<Integrations>(empty);
  const [originalToken, setOriginalToken] = useState<string>("");
  const [tokenEditing, setTokenEditing] = useState(false);
  const [savingBlock, setSavingBlock] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!store) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("store_integrations")
        .select("*")
        .eq("store_id", store.id)
        .maybeSingle();
      if (data) {
        setForm({
          meta_pixel_id: data.meta_pixel_id || "",
          meta_pixel_enabled: !!data.meta_pixel_enabled,
          meta_capi_token: data.meta_capi_token || "",
          meta_capi_enabled: !!data.meta_capi_enabled,
          meta_test_event_code: data.meta_test_event_code || "",
          google_ads_conversion_id: data.google_ads_conversion_id || "",
          google_ads_conversion_label: data.google_ads_conversion_label || "",
          google_ads_enabled: !!data.google_ads_enabled,
          tiktok_pixel_id: data.tiktok_pixel_id || "",
          tiktok_pixel_enabled: !!data.tiktok_pixel_enabled,
        });
        setOriginalToken(data.meta_capi_token || "");
      }
      setFetched(true);
    })();
  }, [store]);

  const saveBlock = async (
    block: "meta" | "google" | "tiktok",
    fields: Partial<Integrations>,
  ) => {
    if (!store) return;
    setSavingBlock(block);
    const payload: any = { store_id: store.id, ...fields };
    const { error } = await (supabase as any)
      .from("store_integrations")
      .upsert(payload, { onConflict: "store_id" });

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Integration settings updated." });
      if (block === "meta" && tokenEditing) {
        setOriginalToken(form.meta_capi_token);
        setTokenEditing(false);
      }
    }
    setSavingBlock(null);
  };

  if (loading || !fetched) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const tokenDisplay = tokenEditing ? form.meta_capi_token : maskToken(originalToken);

  return (
    <div className="max-w-2xl">
      <Link
        to="/dashboard/settings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-body mb-3"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>
      <h1 className="font-heading font-bold text-2xl text-foreground mb-1">Ad Tracking</h1>
      <p className="text-sm text-muted-foreground font-body mb-6">
        Connect your ad platforms to track storefront conversions.
      </p>

      <div className="space-y-6">
        {/* META */}
        <div className="bg-card rounded-xl p-5 store-shadow space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#0866FF]/10 flex items-center justify-center text-[#0866FF] font-heading font-bold text-sm">
                M
              </div>
              <div>
                <p className="font-heading font-semibold text-base text-foreground">Meta</p>
                <p className="text-xs text-muted-foreground">Facebook & Instagram tracking</p>
              </div>
            </div>
          </div>

          {/* Meta Pixel sub-block */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body font-semibold text-sm text-foreground">Meta Pixel</p>
                <StatusBadge active={form.meta_pixel_enabled} configured={!!form.meta_pixel_id} />
              </div>
              <Switch
                checked={form.meta_pixel_enabled}
                onCheckedChange={(v) => setForm({ ...form, meta_pixel_enabled: v })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Pixel ID</label>
              <input
                value={form.meta_pixel_id}
                onChange={(e) => setForm({ ...form, meta_pixel_id: e.target.value })}
                placeholder="e.g. 1234567890123"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">
                Test Event Code <span className="text-muted-foreground">(For debugging only)</span>
              </label>
              <input
                value={form.meta_test_event_code}
                onChange={(e) => setForm({ ...form, meta_test_event_code: e.target.value })}
                placeholder="TEST12345"
                className={inputClass}
              />
            </div>
          </div>

          {/* Meta CAPI sub-block */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body font-semibold text-sm text-foreground">Conversions API</p>
                <StatusBadge active={form.meta_capi_enabled} configured={!!(originalToken || form.meta_capi_token)} />
              </div>
              <Switch
                checked={form.meta_capi_enabled}
                onCheckedChange={(v) => setForm({ ...form, meta_capi_enabled: v })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-body mb-1 block">Access Token</label>
              <div className="flex gap-2">
                <input
                  type={tokenEditing ? "text" : "password"}
                  value={tokenDisplay}
                  onChange={(e) => {
                    if (!tokenEditing) {
                      setTokenEditing(true);
                      setForm({ ...form, meta_capi_token: e.target.value });
                    } else {
                      setForm({ ...form, meta_capi_token: e.target.value });
                    }
                  }}
                  onFocus={() => {
                    if (!tokenEditing && originalToken) {
                      setTokenEditing(true);
                      setForm({ ...form, meta_capi_token: "" });
                    }
                  }}
                  placeholder="EAAxxxxx..."
                  className={inputClass}
                />
                {tokenEditing && originalToken && (
                  <button
                    onClick={() => {
                      setForm({ ...form, meta_capi_token: originalToken });
                      setTokenEditing(false);
                    }}
                    className="px-3 h-11 rounded-lg text-xs font-body text-muted-foreground border border-border hover:bg-muted"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          <a
            href="https://business.facebook.com/events_manager"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-body"
          >
            Find your Pixel ID & token in Meta Events Manager
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={() =>
              saveBlock("meta", {
                meta_pixel_id: form.meta_pixel_id || null as any,
                meta_pixel_enabled: form.meta_pixel_enabled,
                meta_capi_token: tokenEditing
                  ? (form.meta_capi_token || null as any)
                  : (originalToken || null as any),
                meta_capi_enabled: form.meta_capi_enabled,
                meta_test_event_code: form.meta_test_event_code || null as any,
              })
            }
            disabled={savingBlock === "meta"}
            className="h-10 w-full rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {savingBlock === "meta" && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Meta Settings
          </button>
        </div>

        {/* GOOGLE ADS */}
        <div className="bg-card rounded-xl p-5 store-shadow space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#4285F4]/10 flex items-center justify-center text-[#4285F4] font-heading font-bold text-sm">
                G
              </div>
              <div>
                <p className="font-heading font-semibold text-base text-foreground">Google Ads</p>
                <StatusBadge
                  active={form.google_ads_enabled}
                  configured={!!form.google_ads_conversion_id}
                />
              </div>
            </div>
            <Switch
              checked={form.google_ads_enabled}
              onCheckedChange={(v) => setForm({ ...form, google_ads_enabled: v })}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-body mb-1 block">Conversion ID</label>
            <input
              value={form.google_ads_conversion_id}
              onChange={(e) => setForm({ ...form, google_ads_conversion_id: e.target.value })}
              placeholder="e.g. AW-123456789"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-body mb-1 block">
              Purchase Conversion Label
            </label>
            <input
              value={form.google_ads_conversion_label}
              onChange={(e) => setForm({ ...form, google_ads_conversion_label: e.target.value })}
              placeholder="abcDEF123"
              className={inputClass}
            />
          </div>

          <a
            href="https://ads.google.com/aw/conversions"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-body"
          >
            Find your Conversion ID in Google Ads → Tools → Conversions
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={() =>
              saveBlock("google", {
                google_ads_conversion_id: form.google_ads_conversion_id || null as any,
                google_ads_conversion_label: form.google_ads_conversion_label || null as any,
                google_ads_enabled: form.google_ads_enabled,
              })
            }
            disabled={savingBlock === "google"}
            className="h-10 w-full rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {savingBlock === "google" && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Google Ads Settings
          </button>
        </div>

        {/* TIKTOK */}
        <div className="bg-card rounded-xl p-5 store-shadow space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-foreground/10 flex items-center justify-center text-foreground font-heading font-bold text-sm">
                T
              </div>
              <div>
                <p className="font-heading font-semibold text-base text-foreground">TikTok Pixel</p>
                <StatusBadge
                  active={form.tiktok_pixel_enabled}
                  configured={!!form.tiktok_pixel_id}
                />
              </div>
            </div>
            <Switch
              checked={form.tiktok_pixel_enabled}
              onCheckedChange={(v) => setForm({ ...form, tiktok_pixel_enabled: v })}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-body mb-1 block">Pixel ID</label>
            <input
              value={form.tiktok_pixel_id}
              onChange={(e) => setForm({ ...form, tiktok_pixel_id: e.target.value })}
              placeholder="e.g. C4XXXXXXXXXXXXXXXX"
              className={inputClass}
            />
          </div>

          <a
            href="https://ads.tiktok.com/i18n/events_manager"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-body"
          >
            Find your Pixel ID in TikTok Events Manager
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={() =>
              saveBlock("tiktok", {
                tiktok_pixel_id: form.tiktok_pixel_id || null as any,
                tiktok_pixel_enabled: form.tiktok_pixel_enabled,
              })
            }
            disabled={savingBlock === "tiktok"}
            className="h-10 w-full rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {savingBlock === "tiktok" && <Loader2 className="w-4 h-4 animate-spin" />}
            Save TikTok Settings
          </button>
        </div>
      </div>
    </div>
  );
}
