import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "ref_code";
const STORAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface StoredRef {
  code: string;
  storeId: string;
  ts: number;
}

export interface ReferralCampaign {
  id: string;
  code: string;
  influencer_name: string;
  discount_percent: number;
  commission_percent: number;
}

/**
 * Reads ?ref= from URL, validates against referral_campaigns for this store,
 * persists in localStorage for 30 days, records a click on first capture.
 * Returns the active campaign for the current store (if any) and discount %.
 */
export function useReferral(storeId: string | undefined) {
  const [campaign, setCampaign] = useState<ReferralCampaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;

    const run = async () => {
      // 1. Pull from URL or storage
      const url = new URL(window.location.href);
      const urlCode = url.searchParams.get("ref")?.trim().toUpperCase() || null;

      let codeToValidate: string | null = null;
      let isFresh = false;

      if (urlCode) {
        codeToValidate = urlCode;
        isFresh = true;
      } else {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed: StoredRef = JSON.parse(raw);
            if (
              parsed.storeId === storeId &&
              Date.now() - parsed.ts < STORAGE_TTL_MS
            ) {
              codeToValidate = parsed.code;
            }
          }
        } catch {
          /* ignore */
        }
      }

      if (!codeToValidate) {
        if (!cancelled) setLoading(false);
        return;
      }

      // 2. Validate against DB
      const { data } = await (supabase
        .from("referral_campaigns" as any)
        .select("id, code, influencer_name, discount_percent, commission_percent")
        .eq("store_id", storeId)
        .eq("code", codeToValidate)
        .eq("is_active", true)
        .maybeSingle() as any);

      if (cancelled) return;

      if (data) {
        setCampaign(data as ReferralCampaign);
        // Persist
        const stored: StoredRef = { code: data.code, storeId, ts: Date.now() };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        } catch {
          /* ignore */
        }
        // Log click only on fresh capture from URL
        if (isFresh) {
          await (supabase
            .from("referral_clicks" as any)
            .insert({ campaign_id: data.id, store_id: storeId }) as any);
        }
      } else if (urlCode) {
        // Invalid code in URL - clear any stale storage
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }

      setLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  return { campaign, loading };
}
