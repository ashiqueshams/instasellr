// AI brain for the chatbot. Handles Bangla / English / Benglish.
// Used by both meta-messenger-webhook (production) and the dashboard "Test the bot" panel.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface ReplyInput {
  store_id: string;
  text?: string;
  image_urls?: string[]; // customer-attached images / story media
  source?: "dm" | "story_reply" | "comment" | "story_mention";
  context?: string; // optional extra context (e.g. story caption)
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as ReplyInput;
    if (!body.store_id) {
      return json({ error: "store_id required" }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load knowledge base
    const [
      { data: settings },
      { data: products },
      { data: faqs },
      { data: delivery },
    ] = await Promise.all([
      supabase.from("chatbot_settings").select("*").eq("store_id", body.store_id).maybeSingle(),
      supabase
        .from("products")
        .select("id,name,price,compare_at_price,description,tagline,category,material,care_instructions,stock_quantity,is_active,image_url")
        .eq("store_id", body.store_id)
        .eq("is_active", true),
      supabase.from("chatbot_faqs").select("*").eq("store_id", body.store_id).eq("is_active", true),
      supabase.from("delivery_options").select("*").eq("store_id", body.store_id).eq("is_active", true),
    ]);

    const tone = settings?.tone ?? "friendly";
    const defaultLang = settings?.default_language ?? "auto";
    const fallback = settings?.fallback_message ?? "Apu ektu wait korun, amader team ekhuni reply dibe! 💕";
    const threshold = Number(settings?.escalation_threshold ?? 0.6);

    const productCatalog = (products ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      compare_at_price: p.compare_at_price,
      tagline: p.tagline,
      description: p.description?.slice(0, 300),
      category: p.category,
      material: p.material,
      care: p.care_instructions,
      in_stock: p.stock_quantity == null ? true : p.stock_quantity > 0,
    }));

    const faqList = (faqs ?? []).map((f) => ({ q: f.question, a: f.answer, keywords: f.keywords }));
    const deliveryList = (delivery ?? []).map((d) => ({ label: d.label, cost: Number(d.cost) }));

    const systemPrompt = buildSystemPrompt({
      tone,
      defaultLang,
      source: body.source ?? "dm",
      productCatalog,
      faqList,
      deliveryList,
    });

    // Build user message (multimodal if images)
    const userContent: any[] = [];
    if (body.text) userContent.push({ type: "text", text: body.text });
    if (body.context) userContent.push({ type: "text", text: `[Context: ${body.context}]` });
    for (const url of body.image_urls ?? []) {
      userContent.push({ type: "image_url", image_url: { url } });
    }
    if (userContent.length === 0) {
      userContent.push({ type: "text", text: "(empty message)" });
    }

    const aiBody = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "answer_customer",
            description: "Produce a customer reply with intent metadata.",
            parameters: {
              type: "object",
              properties: {
                detected_language: { type: "string", enum: ["bn", "en", "benglish", "other"] },
                intent: {
                  type: "string",
                  enum: ["price", "material", "delivery", "availability", "greeting", "complaint", "spam", "other"],
                },
                matched_product_id: { type: "string", description: "UUID of matched product, or empty string." },
                confidence: { type: "number", description: "0..1 — how confident the bot is in its answer." },
                reply: { type: "string", description: "The reply text to send the customer, in their language." },
                public_comment_reply: {
                  type: "string",
                  description: "Short public comment reply (1 line, used only when source=comment). Empty otherwise.",
                },
                should_escalate: { type: "boolean", description: "True if a human should take over." },
              },
              required: ["detected_language", "intent", "confidence", "reply", "should_escalate"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "answer_customer" } },
    };

    const aiRes = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(aiBody),
    });

    if (aiRes.status === 429) return json({ error: "Rate limited, please try again." }, 429);
    if (aiRes.status === 402) return json({ error: "AI credits exhausted. Add funds in workspace settings." }, 402);
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      return json({ error: "AI gateway error", reply: fallback, should_escalate: true }, 200);
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return json({ reply: fallback, should_escalate: true, confidence: 0 });
    }
    const args = JSON.parse(toolCall.function.arguments);

    // Force escalation if low confidence or complaint
    const escalate =
      args.should_escalate ||
      args.intent === "complaint" ||
      Number(args.confidence ?? 0) < threshold;

    return json({
      reply: args.reply,
      public_comment_reply: args.public_comment_reply ?? "",
      detected_language: args.detected_language,
      intent: args.intent,
      matched_product_id: args.matched_product_id || null,
      confidence: Number(args.confidence ?? 0),
      should_escalate: escalate,
      auto_send: !escalate,
    });
  } catch (e) {
    console.error("chatbot-reply error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function buildSystemPrompt(args: {
  tone: string;
  defaultLang: string;
  source: string;
  productCatalog: any[];
  faqList: any[];
  deliveryList: any[];
}) {
  const toneMap: Record<string, string> = {
    formal: "Formal, polite Bangla. Use 'apni'.",
    friendly: "Warm and friendly. Use 'apu/bhai' naturally. Light emoji ok 💕✨",
    casual: "Casual Benglish, like a Bangladeshi shop owner texting on Messenger. Short sentences. Emoji ok.",
  };
  const langMap: Record<string, string> = {
    auto: "Reply in the SAME language/script the customer used (Bangla / English / Benglish).",
    bn: "Always reply in Bangla script.",
    en: "Always reply in English.",
    benglish: "Always reply in Benglish (Bangla written in Roman letters).",
  };

  return `You are an AI customer support agent for a Bangladeshi online shop. You answer DMs, story replies, and comments from Instagram and Facebook.

LANGUAGE: ${langMap[args.defaultLang] ?? langMap.auto}
TONE: ${toneMap[args.tone] ?? toneMap.friendly}
SOURCE: ${args.source}

KNOWLEDGE — PRODUCT CATALOG (JSON):
${JSON.stringify(args.productCatalog).slice(0, 8000)}

KNOWLEDGE — FAQ ENTRIES:
${JSON.stringify(args.faqList).slice(0, 3000)}

KNOWLEDGE — DELIVERY OPTIONS (price in BDT):
${JSON.stringify(args.deliveryList)}

RULES:
- Customers often write "price?", "pp", "dp", "koto", "দাম কত", "kotoy" — all mean "what is the price?"
- If the customer attached an image, identify which product it shows from the catalog. If unsure, set confidence low.
- Always include the price in BDT (Taka) with the ৳ symbol or "tk" when answering price questions.
- For delivery questions: "Inside Dhaka" labels = inside Dhaka cost; "Outside Dhaka" / district names = outside cost.
- Keep replies SHORT — like a real Messenger reply, 1–3 sentences max.
- For comments (source=comment): also produce a 1-line public_comment_reply like "DM kore dilam apu! 💕" or "Check your DM!" matching the customer's language.
- If the customer is angry, complaining, asking about a missing order, refund, or anything you cannot answer with the knowledge above → set should_escalate=true and reply with a short polite holding message.
- If the message is just an emoji, "nice", or unrelated → intent="spam", confidence=0.1, reply=""
- Never make up prices, materials, or delivery info that's not in the knowledge above.
- Use the answer_customer function to respond. Never reply outside the function call.`;
}
