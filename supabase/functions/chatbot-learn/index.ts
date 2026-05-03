// Weekly learning loop. For each store with enough events,
// asks Gemini Pro to analyze wins/losses and rewrite the playbook strategy.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MIN_EVENTS = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let body: any = {};
    try { body = await req.json(); } catch { /* cron call has no body */ }
    const onlyStoreId: string | null = body?.store_id ?? null;

    const sinceIso = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    // Distinct stores with events in last 7d
    let storesQuery = supabase
      .from("chatbot_learning_events")
      .select("store_id")
      .gte("created_at", sinceIso);
    if (onlyStoreId) storesQuery = storesQuery.eq("store_id", onlyStoreId);
    const { data: rows } = await storesQuery;
    const storeIds = Array.from(new Set((rows ?? []).map((r: any) => r.store_id)));

    const updates: any[] = [];

    for (const storeId of storeIds) {
      const { data: events } = await supabase
        .from("chatbot_learning_events")
        .select("*")
        .eq("store_id", storeId)
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!events || events.length < MIN_EVENTS) {
        updates.push({ store_id: storeId, skipped: true, reason: `only ${events?.length ?? 0} events` });
        continue;
      }

      const won = events.filter((e: any) => e.outcome === "won");
      const lost = events.filter((e: any) => e.outcome !== "won");
      const trimmed = (arr: any[]) =>
        arr.slice(0, 30).map((e: any) => ({
          outcome: e.outcome,
          order_value: e.order_value,
          discount: e.discount_offered_percent,
          tags: e.behavior_tags,
          snapshot: (e.conversation_snapshot ?? []).slice(-8),
        }));

      const prompt = `You are an analyst optimizing the sales playbook for a Bangladeshi online shop's AI chatbot.

WON CONVERSATIONS (${won.length}):
${JSON.stringify(trimmed(won)).slice(0, 6000)}

LOST/ABANDONED (${lost.length}):
${JSON.stringify(trimmed(lost)).slice(0, 6000)}

Analyze patterns. Output a strategy the chatbot should follow next week to convert better — without being pushy. Cover:
- best openers
- objection handlers (especially price)
- when to mention delivery / when to ask for phone vs address first
- discount timing & triggers
- segments that convert and what they responded to
- mistakes to avoid

Also write a 2-sentence human-readable summary the shop owner will see in their dashboard.`;

      const aiRes = await fetch(LOVABLE_AI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: "You output a structured strategy via the save_strategy function. Be concrete, not generic." },
            { role: "user", content: prompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "save_strategy",
                description: "Persist the new playbook strategy",
                parameters: {
                  type: "object",
                  properties: {
                    summary: { type: "string", description: "2 sentences for the owner dashboard." },
                    best_openers: { type: "array", items: { type: "string" } },
                    objection_handlers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          objection: { type: "string" },
                          recommended_response: { type: "string" },
                        },
                        required: ["objection", "recommended_response"],
                      },
                    },
                    info_collection_order: { type: "array", items: { type: "string" } },
                    discount_strategy: { type: "string" },
                    segment_insights: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          segment: { type: "string" },
                          what_worked: { type: "string" },
                        },
                        required: ["segment", "what_worked"],
                      },
                    },
                    mistakes_to_avoid: { type: "array", items: { type: "string" } },
                  },
                  required: ["summary"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "save_strategy" } },
        }),
      });

      if (!aiRes.ok) {
        updates.push({ store_id: storeId, error: `ai ${aiRes.status}` });
        continue;
      }
      const aiJson = await aiRes.json();
      const tool = aiJson.choices?.[0]?.message?.tool_calls?.[0];
      if (!tool) {
        updates.push({ store_id: storeId, error: "no tool call" });
        continue;
      }
      const strategy = JSON.parse(tool.function.arguments);

      // Get next version
      const { data: prev } = await supabase
        .from("chatbot_playbook")
        .select("version")
        .eq("store_id", storeId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersion = (prev?.version ?? 0) + 1;

      // Deactivate previous, insert new
      await supabase
        .from("chatbot_playbook")
        .update({ is_active: false })
        .eq("store_id", storeId);

      await supabase.from("chatbot_playbook").insert({
        store_id: storeId,
        version: nextVersion,
        strategy,
        summary: strategy.summary ?? "",
        sample_size: events.length,
        is_active: true,
      });

      updates.push({ store_id: storeId, version: nextVersion, sample_size: events.length });
    }

    return json({ updates });
  } catch (e) {
    console.error("learn error", e);
    return json({ error: String(e) }, 500);
  }
});

function json(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
