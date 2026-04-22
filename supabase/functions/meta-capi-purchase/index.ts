// Meta Conversions API (CAPI) — server-side Purchase event
// Called fire-and-forget from the storefront after a successful order.
// Sensitive data (CAPI access token, raw email/phone) is never returned to the client.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hashSHA256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizePhone(raw: string): string {
  // Keep digits; preserve a leading + by stripping then re-adding nothing
  // Meta expects digits only, hashed.
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D+/g, "");
  return hasPlus ? "+" + digits : digits;
}

interface RequestBody {
  store_id?: string;
  order_id?: string;
  event_id?: string;
  value?: number;
  currency?: string;
  content_ids?: string[];
  customer?: { email?: string; phone?: string | null };
  browser_data?: {
    client_ip_address?: string | null;
    client_user_agent?: string | null;
    fbc?: string | null;
    fbp?: string | null;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const {
    store_id,
    order_id,
    event_id,
    value,
    currency,
    content_ids,
    customer,
    browser_data,
  } = body;

  if (!store_id || !order_id || !event_id || typeof value !== "number" || !currency || !customer?.email) {
    return json({ error: "Missing required fields" }, 400);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: integ, error: integErr } = await admin
      .from("store_integrations")
      .select("meta_capi_enabled, meta_capi_token, meta_pixel_id, meta_test_event_code")
      .eq("store_id", store_id)
      .maybeSingle();

    if (integErr) {
      console.error("[meta-capi] integration fetch failed", integErr.message);
      return json({ success: false, error: "config_fetch_failed" }, 500);
    }

    if (!integ || !integ.meta_capi_enabled || !integ.meta_capi_token || !integ.meta_pixel_id) {
      return json({ skipped: true });
    }

    // Hash PII server-side
    const emailHash = await hashSHA256(customer.email);
    const phoneHash = customer.phone ? await hashSHA256(normalizePhone(customer.phone)) : undefined;

    // Resolve client IP from request headers if not supplied
    const ip =
      browser_data?.client_ip_address ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const userData: Record<string, unknown> = {
      em: [emailHash],
      client_user_agent: browser_data?.client_user_agent || req.headers.get("user-agent") || undefined,
    };
    if (phoneHash) userData.ph = [phoneHash];
    if (ip) userData.client_ip_address = ip;
    if (browser_data?.fbc) userData.fbc = browser_data.fbc;
    if (browser_data?.fbp) userData.fbp = browser_data.fbp;

    const event: Record<string, unknown> = {
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      event_id,
      action_source: "website",
      user_data: userData,
      custom_data: {
        value,
        currency,
        order_id,
        content_ids: content_ids || [],
        content_type: "product",
      },
    };

    const payload: Record<string, unknown> = { data: [event] };
    if (integ.meta_test_event_code && integ.meta_test_event_code.trim() !== "") {
      payload.test_event_code = integ.meta_test_event_code;
    }

    const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(
      integ.meta_pixel_id,
    )}/events?access_token=${encodeURIComponent(integ.meta_capi_token)}`;

    const metaRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const metaJson = await metaRes.json().catch(() => ({}));

    if (!metaRes.ok) {
      // Log full error server-side, return sanitized message to caller
      console.error("[meta-capi] Meta error", metaRes.status, JSON.stringify(metaJson));
      return json(
        {
          success: false,
          error: {
            message: metaJson?.error?.message || "Meta CAPI request failed",
            type: metaJson?.error?.type,
            code: metaJson?.error?.code,
          },
        },
        500,
      );
    }

    return json({
      success: true,
      events_received: metaJson?.events_received ?? null,
      fbtrace_id: metaJson?.fbtrace_id ?? null,
    });
  } catch (err) {
    console.error("[meta-capi] unhandled error", err instanceof Error ? err.message : String(err));
    return json({ success: false, error: "internal_error" }, 500);
  }
});
