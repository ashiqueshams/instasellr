// Conversation recovery — runs every 30 min via pg_cron.
// Finds conversations stuck in collecting_info / considering for N hours
// (within Meta's 24h messaging window), generates ONE personalized nudge.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const GRAPH_BASE = "https://graph.facebook.com/v21.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // All stores with recovery enabled
    const { data: settingsList } = await supabase
      .from("chatbot_settings")
      .select("*")
      .eq("enabled", true)
      .eq("recovery_enabled", true);

    let processed = 0;
    let sent = 0;

    for (const settings of settingsList ?? []) {
      const delayHours = settings.recovery_delay_hours ?? 4;
      const cutoffSilent = new Date(Date.now() - delayHours * 3600 * 1000).toISOString();
      const cutoffWindow = new Date(Date.now() - 22 * 3600 * 1000).toISOString(); // safety inside 24h

      const { data: convs } = await supabase
        .from("chatbot_conversations")
        .select("*")
        .eq("store_id", settings.store_id)
        .in("sales_stage", ["collecting_info", "considering", "objection"])
        .lt("last_message_at", cutoffSilent)
        .gt("last_message_at", cutoffWindow)
        .neq("status", "resolved");

      for (const conv of convs ?? []) {
        processed++;

        // Skip if we already nudged this conversation since last customer message
        const { data: lastNudge } = await supabase
          .from("chatbot_messages")
          .select("created_at,sender")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (lastNudge?.[0]?.sender === "ai") continue;

        // Check profile recovery_sent_at — don't pester repeatedly
        const { data: profile } = await supabase
          .from("customer_profiles")
          .select("*")
          .eq("store_id", settings.store_id)
          .eq("customer_psid", conv.customer_psid)
          .maybeSingle();

        if (profile?.recovery_sent_at) {
          const recentlyNudged =
            Date.now() - new Date(profile.recovery_sent_at).getTime() < 20 * 3600 * 1000;
          if (recentlyNudged) continue;
        }

        // Ask the brain for a recovery message
        const ai = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/chatbot-reply`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              store_id: settings.store_id,
              conversation_id: conv.id,
              customer_psid: conv.customer_psid,
              platform: conv.platform,
              source: "dm",
              context:
                "RECOVERY: customer went silent. Send ONE short, warm nudge tuned to their profile/cart_draft. If price-sensitive and discount rules allow, you may mention a small incentive. Never beg.",
              text: "(internal recovery trigger)",
            }),
          },
        );
        if (!ai.ok) continue;
        const aiJson = await ai.json();
        if (!aiJson.reply || aiJson.should_escalate) continue;

        // Send the DM
        try {
          await fetch(`${GRAPH_BASE}/me/messages?access_token=${settings.meta_page_access_token}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipient: { id: conv.customer_psid },
              message: { text: aiJson.reply },
              messaging_type: "RESPONSE",
            }),
          });
          sent++;

          await supabase.from("chatbot_messages").insert({
            conversation_id: conv.id,
            direction: "out",
            sender: "ai",
            text: aiJson.reply,
            intent: "recovery",
          });

          await supabase
            .from("customer_profiles")
            .upsert(
              {
                store_id: settings.store_id,
                platform: conv.platform,
                customer_psid: conv.customer_psid,
                recovery_sent_at: new Date().toISOString(),
              },
              { onConflict: "store_id,platform,customer_psid" },
            );
        } catch (e) {
          console.error("recovery send failed", e);
        }
      }
    }

    return new Response(JSON.stringify({ processed, sent }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recovery error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
