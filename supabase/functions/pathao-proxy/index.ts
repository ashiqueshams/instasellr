import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PATHAO_BASE = "https://api-hermes.pathao.com/aladdin/api/v1";

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function getValidToken(storeId: string): Promise<string> {
  const sb = supabaseAdmin();
  const { data: settings, error } = await sb
    .from("courier_settings")
    .select("*")
    .eq("store_id", storeId)
    .eq("provider", "pathao")
    .single();

  if (error || !settings) throw new Error("Courier settings not found for this store");

  const now = new Date();
  const expiresAt = settings.token_expires_at ? new Date(settings.token_expires_at) : null;

  // If token is still valid (with 5 min buffer)
  if (settings.access_token && expiresAt && expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return settings.access_token;
  }

  // Try refresh
  if (settings.refresh_token) {
    try {
      const res = await fetch(`${PATHAO_BASE}/issue-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          client_id: settings.client_id,
          client_secret: settings.client_secret,
          grant_type: "refresh_token",
          refresh_token: settings.refresh_token,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newExpires = new Date(now.getTime() + data.expires_in * 1000);
        await sb
          .from("courier_settings")
          .update({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            token_expires_at: newExpires.toISOString(),
          })
          .eq("id", settings.id);
        return data.access_token;
      }
    } catch (_) {
      // Fall through to full auth
    }
  }

  // Full auth with password
  const res = await fetch(`${PATHAO_BASE}/issue-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: settings.client_id,
      client_secret: settings.client_secret,
      username: settings.client_email,
      password: settings.client_password,
      grant_type: "password",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pathao auth failed: ${err}`);
  }

  const data = await res.json();
  const newExpires = new Date(now.getTime() + data.expires_in * 1000);
  await sb
    .from("courier_settings")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_expires_at: newExpires.toISOString(),
    })
    .eq("id", settings.id);

  return data.access_token;
}

async function pathaoGet(token: string, path: string) {
  const res = await fetch(`${PATHAO_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Pathao API error [${res.status}]: ${await res.text()}`);
  return res.json();
}

async function pathaoPost(token: string, path: string, body: Record<string, unknown>) {
  const res = await fetch(`${PATHAO_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Pathao API error [${res.status}]: ${await res.text()}`);
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, store_id, ...params } = await req.json();

    if (!store_id) throw new Error("store_id is required");

    // Issue token action — called during initial setup, no existing token needed
    if (action === "issue-token") {
      const { client_id, client_secret, username, password } = params;
      const res = await fetch(`${PATHAO_BASE}/issue-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          client_id,
          client_secret,
          username,
          password,
          grant_type: "password",
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Pathao auth failed: ${err}`);
      }
      const data = await res.json();
      const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

      // Upsert courier settings
      const sb = supabaseAdmin();
      const { data: existing } = await sb
        .from("courier_settings")
        .select("id")
        .eq("store_id", store_id)
        .eq("provider", "pathao")
        .maybeSingle();

      if (existing) {
        await sb
          .from("courier_settings")
          .update({
            client_id,
            client_secret,
            client_email: username,
            client_password: password,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            token_expires_at: expiresAt,
          })
          .eq("id", existing.id);
      } else {
        await sb.from("courier_settings").insert({
          store_id,
          provider: "pathao",
          client_id,
          client_secret,
          client_email: username,
          client_password: password,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_expires_at: expiresAt,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // All other actions require a valid token
    const token = await getValidToken(store_id);

    if (action === "get-cities") {
      const data = await pathaoGet(token, "/countries/1/city-list");
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-zones") {
      const data = await pathaoGet(token, `/cities/${params.city_id}/zone-list`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-areas") {
      const data = await pathaoGet(token, `/zones/${params.zone_id}/area-list`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create-store") {
      const data = await pathaoPost(token, "/stores", {
        name: params.name,
        contact_name: params.contact_name,
        contact_number: params.contact_number,
        secondary_contact: params.secondary_contact || undefined,
        address: params.address,
        city_id: params.city_id,
        zone_id: params.zone_id,
        area_id: params.area_id,
      });

      // Save pathao store id
      const sb = supabaseAdmin();
      await sb
        .from("courier_settings")
        .update({ pathao_store_id: data.data?.store_id || data.store_id })
        .eq("store_id", store_id)
        .eq("provider", "pathao");

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get-stores") {
      const data = await pathaoGet(token, "/stores");
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create-order") {
      const sb = supabaseAdmin();
      const { data: settings } = await sb
        .from("courier_settings")
        .select("pathao_store_id")
        .eq("store_id", store_id)
        .eq("provider", "pathao")
        .single();

      if (!settings?.pathao_store_id) {
        throw new Error("Pathao store not configured. Please set up a Pathao store first.");
      }

      const orderPayload = {
        store_id: settings.pathao_store_id,
        merchant_order_id: params.order_id,
        recipient_name: params.recipient_name,
        recipient_phone: params.recipient_phone,
        recipient_address: params.recipient_address,
        recipient_city: params.recipient_city_id,
        recipient_zone: params.recipient_zone_id,
        recipient_area: params.recipient_area_id,
        delivery_type: 48,
        item_type: 2,
        special_instruction: params.special_instruction || "",
        item_quantity: params.item_quantity || 1,
        item_weight: params.item_weight || 0.5,
        amount_to_collect: params.amount_to_collect || 0,
        item_description: params.item_description || "",
      };

      const data = await pathaoPost(token, "/orders", orderPayload);

      // Save consignment ID to order
      if (data.data?.consignment_id) {
        await sb
          .from("orders")
          .update({
            pathao_consignment_id: String(data.data.consignment_id),
            status: "dispatched",
          })
          .eq("id", params.order_id);
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("pathao-proxy error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
