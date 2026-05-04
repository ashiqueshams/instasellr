// AI Sales Brain — handles Bangla / English / Benglish.
// Inputs: customer message (text + optional images) for a given store + customer.
// Loads: chatbot settings, product catalog, FAQs, delivery options,
//        active playbook, discount rules, customer profile, recent conversation history.
// Outputs (single tool call): reply, sentiment, intent, sales_stage,
//        cart_draft updates, customer_profile updates, feedback, discount offer,
//        confirmation request, order creation trigger, escalation flag.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface ReplyInput {
  store_id: string;
  conversation_id?: string;        // when called from webhook
  customer_psid?: string;          // when called from webhook
  platform?: string;               // when called from webhook
  text?: string;
  image_urls?: string[];
  source?: "dm" | "story_reply" | "comment" | "story_mention";
  context?: string;
  test_mode?: boolean;             // dashboard test panel — skip writes / order creation
  simulate_out_of_stock?: boolean; // test-mode helper: pretend matched products are OOS
  pagination?: {                   // "See more" postback
    query: { kind: "category" | "tags" | "all"; value?: string };
    page: number;
  };
}

const CARDS_PAGE_SIZE = 10;

interface ProductCard {
  id: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  category: string | null;
  in_stock: boolean;
  tagline: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as ReplyInput;
    if (!body.store_id) return json({ error: "store_id required" }, 400);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ---------- Load knowledge ----------
    const [
      { data: settings },
      { data: products },
      { data: faqs },
      { data: delivery },
      { data: discountRules },
      { data: playbookRows },
    ] = await Promise.all([
      supabase.from("chatbot_settings").select("*").eq("store_id", body.store_id).maybeSingle(),
      supabase
        .from("products")
        .select("id,name,price,compare_at_price,description,tagline,category,material,care_instructions,stock_quantity,is_active,image_url")
        .eq("store_id", body.store_id)
        .eq("is_active", true),
      supabase.from("chatbot_faqs").select("*").eq("store_id", body.store_id).eq("is_active", true),
      supabase.from("delivery_options").select("*").eq("store_id", body.store_id).eq("is_active", true),
      supabase.from("chatbot_discount_rules").select("*").eq("store_id", body.store_id).maybeSingle(),
      supabase
        .from("chatbot_playbook")
        .select("*")
        .eq("store_id", body.store_id)
        .eq("is_active", true)
        .order("version", { ascending: false })
        .limit(1),
    ]);

    const playbook = playbookRows?.[0] ?? null;

    // ---------- Load conversation + profile ----------
    let conversation: any = null;
    let profile: any = null;
    let history: any[] = [];

    if (body.conversation_id) {
      const { data: convData } = await supabase
        .from("chatbot_conversations")
        .select("*")
        .eq("id", body.conversation_id)
        .maybeSingle();
      conversation = convData;
    }

    const psid = body.customer_psid ?? conversation?.customer_psid;
    const platform = body.platform ?? conversation?.platform ?? "instagram";

    if (psid && !body.test_mode) {
      const { data: profData } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("store_id", body.store_id)
        .eq("platform", platform)
        .eq("customer_psid", psid)
        .maybeSingle();
      profile = profData;
    }

    if (body.conversation_id) {
      const { data: msgs } = await supabase
        .from("chatbot_messages")
        .select("direction,sender,text,sentiment,intent,created_at")
        .eq("conversation_id", body.conversation_id)
        .order("created_at", { ascending: false })
        .limit(20);
      history = (msgs ?? []).reverse();
    }

    // ---------- Build prompt ----------
    const tone = settings?.tone ?? "friendly";
    const defaultLang = settings?.default_language ?? "auto";
    const fallback = settings?.fallback_message ?? "Apu ektu wait korun, amader team ekhuni reply dibe! 💕";
    const threshold = Number(settings?.escalation_threshold ?? 0.6);
    const brainEnabled = settings?.brain_enabled !== false;

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

    const cartDraft = conversation?.cart_draft ?? {};
    const salesStage = conversation?.sales_stage ?? "browsing";

    const systemPrompt = buildSystemPrompt({
      tone,
      defaultLang,
      source: body.source ?? "dm",
      productCatalog,
      faqList,
      deliveryList,
      profile,
      cartDraft,
      salesStage,
      discountRules,
      playbookStrategy: playbook?.strategy ?? null,
    });

    const recentTurns = history.map((h) => ({
      role: h.direction === "in" ? "user" : "assistant",
      content: h.text || "",
    }));

    const userContent: any[] = [];
    if (body.text) userContent.push({ type: "text", text: body.text });
    if (body.context) userContent.push({ type: "text", text: `[Context: ${body.context}]` });
    for (const url of body.image_urls ?? []) {
      userContent.push({ type: "image_url", image_url: { url } });
    }
    if (userContent.length === 0) userContent.push({ type: "text", text: "(empty message)" });

    const aiBody = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...recentTurns,
        { role: "user", content: userContent },
      ],
      tools: [BRAIN_TOOL],
      tool_choice: { type: "function", function: { name: "respond" } },
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
      return json({ reply: fallback, should_escalate: true, confidence: 0 });
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return json({ reply: fallback, should_escalate: true, confidence: 0 });
    const args = JSON.parse(toolCall.function.arguments);

    // ---------- Apply discount rules clamp ----------
    let discountPercent = 0;
    if (
      args.should_offer_discount &&
      discountRules?.is_active &&
      brainEnabled
    ) {
      const max = Number(discountRules.max_discount_percent || 0);
      discountPercent = Math.max(0, Math.min(max, Number(args.discount_percent || 0)));
    }

    const escalate =
      args.should_escalate ||
      args.intent === "complaint" ||
      Number(args.confidence ?? 0) < threshold;

    // ---------- Apply writes (skip in test mode) ----------
    let createdOrderId: string | null = null;

    if (!body.test_mode && body.conversation_id && psid) {
      // Merge profile updates
      if (args.profile_update && Object.keys(args.profile_update).length) {
        const upsert: any = {
          store_id: body.store_id,
          customer_psid: psid,
          platform,
          ...sanitizeProfile(args.profile_update),
          last_sentiment: args.sentiment ?? profile?.last_sentiment ?? null,
          last_intent: args.intent ?? profile?.last_intent ?? null,
          silent_since: null,
        };
        // merge behavior_tags
        if (args.profile_update.add_behavior_tags?.length) {
          const existing: string[] = profile?.behavior_tags ?? [];
          const merged = Array.from(new Set([...existing, ...args.profile_update.add_behavior_tags]));
          upsert.behavior_tags = merged;
        }
        await supabase
          .from("customer_profiles")
          .upsert(upsert, { onConflict: "store_id,platform,customer_psid" });
      } else {
        // at least clear silent_since + update last sentiment/intent
        await supabase
          .from("customer_profiles")
          .upsert(
            {
              store_id: body.store_id,
              customer_psid: psid,
              platform,
              last_sentiment: args.sentiment,
              last_intent: args.intent,
              silent_since: null,
            },
            { onConflict: "store_id,platform,customer_psid" },
          );
      }

      // Conversation: stage + cart draft + feedback
      const convPatch: any = {
        sales_stage: args.sales_stage_update ?? salesStage,
        current_intent: args.intent ?? null,
      };
      if (args.cart_draft_update) {
        convPatch.cart_draft = { ...cartDraft, ...args.cart_draft_update };
      }
      if (args.feedback_extracted?.text) {
        convPatch.feedback_text = args.feedback_extracted.text;
        convPatch.feedback_sentiment = args.feedback_extracted.sentiment;
      }
      await supabase.from("chatbot_conversations").update(convPatch).eq("id", body.conversation_id);

      // Tag the just-arrived inbound message with sentiment + intent
      // (the webhook inserts the message before calling us, so we update the latest)
      await supabase
        .from("chatbot_messages")
        .update({ sentiment: args.sentiment, intent: args.intent })
        .eq("conversation_id", body.conversation_id)
        .eq("direction", "in")
        .order("created_at", { ascending: false })
        .limit(1);

      // ---------- Create order on confirm ----------
      if (
        args.should_create_order &&
        !escalate &&
        brainEnabled
      ) {
        const cart = { ...cartDraft, ...(args.cart_draft_update ?? {}) };
        if (cart.product_id && cart.name && cart.phone && cart.address) {
          try {
            const orderRes = await fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/create-order`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                },
                body: JSON.stringify({
                  product_id: cart.product_id,
                  store_id: body.store_id,
                  customer_name: cart.name,
                  customer_email: cart.email || `${psid}@dm.local`,
                  customer_phone: cart.phone,
                  shipping_address: cart.address,
                  shipping_city: cart.city ?? null,
                  quantity: Number(cart.quantity || 1),
                  payment_method: "cod",
                  source: "chatbot",
                }),
              },
            );
            if (orderRes.ok) {
              const orderJson = await orderRes.json();
              createdOrderId = orderJson.order_id ?? null;

              // Mark conversation won + log learning event
              await supabase
                .from("chatbot_conversations")
                .update({ sales_stage: "won", status: "resolved" })
                .eq("id", body.conversation_id);

              await supabase.from("chatbot_learning_events").insert({
                store_id: body.store_id,
                conversation_id: body.conversation_id,
                customer_psid: psid,
                outcome: "won",
                order_value: Number(orderJson.final_amount ?? 0),
                discount_offered_percent: discountPercent,
                behavior_tags: profile?.behavior_tags ?? [],
                conversation_snapshot: history.slice(-10),
              });

              // Update profile lifetime stats
              await supabase
                .from("customer_profiles")
                .update({
                  lifetime_orders: (profile?.lifetime_orders ?? 0) + 1,
                  lifetime_value: Number(profile?.lifetime_value ?? 0) + Number(orderJson.final_amount ?? 0),
                  last_order_at: new Date().toISOString(),
                })
                .eq("store_id", body.store_id)
                .eq("platform", platform)
                .eq("customer_psid", psid);
            }
          } catch (e) {
            console.error("order create from brain failed", e);
          }
        }
      }
    }

    return json({
      reply: args.reply,
      public_comment_reply: args.public_comment_reply ?? "",
      detected_language: args.detected_language,
      intent: args.intent,
      sentiment: args.sentiment,
      sales_stage: args.sales_stage_update,
      cart_draft_update: args.cart_draft_update ?? null,
      profile_update: args.profile_update ?? null,
      feedback_extracted: args.feedback_extracted ?? null,
      discount_offered_percent: discountPercent,
      should_request_confirmation: !!args.should_request_confirmation,
      order_created_id: createdOrderId,
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

function sanitizeProfile(u: any) {
  const out: any = {};
  for (const k of ["name", "phone", "address", "city", "preferred_language", "preferred_size", "preferred_color"]) {
    if (typeof u[k] === "string" && u[k].trim()) out[k] = u[k].trim().slice(0, 300);
  }
  if (Array.isArray(u.preferred_categories)) out.preferred_categories = u.preferred_categories.slice(0, 10);
  return out;
}

const BRAIN_TOOL = {
  type: "function" as const,
  function: {
    name: "respond",
    description: "Single sales-agent decision: reply + signals + actions.",
    parameters: {
      type: "object",
      properties: {
        detected_language: { type: "string", enum: ["bn", "en", "benglish", "other"] },
        sentiment: {
          type: "string",
          enum: ["happy", "excited", "neutral", "hesitant", "frustrated", "angry", "ready_to_buy"],
        },
        intent: {
          type: "string",
          enum: [
            "greeting", "price", "material", "delivery", "availability",
            "objection", "ready_to_buy", "providing_info", "confirmation",
            "feedback", "complaint", "small_talk", "spam", "other",
          ],
        },
        sales_stage_update: {
          type: "string",
          enum: ["browsing", "considering", "objection", "collecting_info", "confirming", "won", "lost"],
        },
        reply: { type: "string", description: "Reply in customer's language. Short, like a real Messenger reply (1-3 sentences)." },
        public_comment_reply: { type: "string", description: "1-line public comment reply (only when source=comment), else empty." },
        matched_product_id: { type: "string", description: "UUID of product the customer is asking about, or empty." },
        cart_draft_update: {
          type: "object",
          description: "Fields the bot extracted/updated for the in-progress order. Omit fields that didn't change.",
          properties: {
            product_id: { type: "string" },
            product_name: { type: "string" },
            quantity: { type: "number" },
            name: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            address: { type: "string" },
            city: { type: "string" },
          },
          additionalProperties: false,
        },
        profile_update: {
          type: "object",
          description: "Customer details newly learned this turn. Omit if nothing new.",
          properties: {
            name: { type: "string" },
            phone: { type: "string" },
            address: { type: "string" },
            city: { type: "string" },
            preferred_language: { type: "string" },
            preferred_size: { type: "string" },
            preferred_color: { type: "string" },
            preferred_categories: { type: "array", items: { type: "string" } },
            add_behavior_tags: {
              type: "array",
              items: {
                type: "string",
                enum: ["price_sensitive", "fast_converter", "image_first", "browser", "complainer", "repeat_buyer", "high_intent", "comparison_shopper"],
              },
            },
          },
          additionalProperties: false,
        },
        feedback_extracted: {
          type: "object",
          description: "If the customer organically gave feedback about a past order or product (without being asked), capture it.",
          properties: {
            text: { type: "string" },
            sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
          },
          additionalProperties: false,
        },
        should_offer_discount: { type: "boolean" },
        discount_percent: { type: "number", description: "Suggested % off (will be clamped to owner's max)." },
        should_request_confirmation: {
          type: "boolean",
          description: "True when the cart_draft has product+name+phone+address and bot is sending a summary asking the customer to confirm.",
        },
        should_create_order: {
          type: "boolean",
          description: "True ONLY when the latest customer message is an explicit confirmation (yes/ok/confirm/হ্যাঁ/done) AFTER a summary was sent.",
        },
        confidence: { type: "number" },
        should_escalate: { type: "boolean" },
      },
      required: ["detected_language", "sentiment", "intent", "reply", "confidence", "should_escalate"],
      additionalProperties: false,
    },
  },
};

function buildSystemPrompt(args: {
  tone: string;
  defaultLang: string;
  source: string;
  productCatalog: any[];
  faqList: any[];
  deliveryList: any[];
  profile: any;
  cartDraft: any;
  salesStage: string;
  discountRules: any;
  playbookStrategy: any;
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

  const profileBlock = args.profile
    ? `KNOWN CUSTOMER PROFILE:
- Name: ${args.profile.name || "unknown"}
- Phone: ${args.profile.phone || "unknown"}
- Address: ${args.profile.address || "unknown"}
- Lifetime orders: ${args.profile.lifetime_orders ?? 0} (value ৳${args.profile.lifetime_value ?? 0})
- Behavior tags: ${(args.profile.behavior_tags ?? []).join(", ") || "none yet"}
- Preferred categories: ${(args.profile.preferred_categories ?? []).join(", ") || "unknown"}
- Last sentiment: ${args.profile.last_sentiment || "n/a"}
USE THIS to personalize tone, skip asking for info you already have, and adapt strategy.`
    : "NEW CUSTOMER — no profile yet. Build it as you learn.";

  const cartBlock = Object.keys(args.cartDraft ?? {}).length
    ? `CURRENT CART DRAFT (already collected): ${JSON.stringify(args.cartDraft)}
Sales stage: ${args.salesStage}.
Only ask for fields that are still missing. Never re-ask for fields already captured.`
    : `No cart in progress yet. Sales stage: ${args.salesStage}.`;

  const discountBlock = args.discountRules?.is_active
    ? `DISCOUNT RULES (you may offer within these rails ONLY):
- Max discount: ${args.discountRules.max_discount_percent}%
- Min order value: ৳${args.discountRules.min_order_value}
- Allowed triggers: ${(args.discountRules.trigger_signals ?? []).join(", ")}
Only suggest a discount when the situation matches one of those triggers AND the customer is hesitant or about to leave. Never lead with a discount.`
    : "DISCOUNTS DISABLED — never offer any discount.";

  const playbookBlock = args.playbookStrategy
    ? `LEARNED STRATEGY FOR THIS STORE (use this — it has been proven to convert):
${JSON.stringify(args.playbookStrategy).slice(0, 2500)}`
    : "No learned strategy yet — use general best practices.";

  return `You are an AI SALES AGENT for a Bangladeshi online shop. Your job is to convert messages into orders WITHOUT being pushy or salesy. Be helpful, warm, human.

LANGUAGE: ${langMap[args.defaultLang] ?? langMap.auto}
TONE: ${toneMap[args.tone] ?? toneMap.friendly}
SOURCE: ${args.source}

${profileBlock}

${cartBlock}

${discountBlock}

${playbookBlock}

PRODUCT CATALOG (JSON):
${JSON.stringify(args.productCatalog).slice(0, 7000)}

FAQ:
${JSON.stringify(args.faqList).slice(0, 2500)}

DELIVERY OPTIONS (BDT):
${JSON.stringify(args.deliveryList)}

CORE RULES:
- "price?", "pp", "dp", "koto", "দাম কত", "kotoy" all mean "what is the price?". Always include ৳ price.
- For images: identify the product from catalog. Low confidence → say so.
- Replies are SHORT (1-3 sentences max). Like a real shop owner on Messenger.
- ORDER FLOW: when customer shows buying intent, COLLECT one missing field at a time in a natural way (name → phone → full address). Once you have product + name + phone + address, send a SUMMARY ("Apu confirm korun: 1x Cotton Kurti, Rahim, 017xxx, Dhanmondi, total ৳1260 + delivery") and set should_request_confirmation=true.
- Set should_create_order=true ONLY when the LATEST customer message is an explicit confirmation (hyan/yes/ok/confirm/done/হ্যাঁ/আচ্ছা) AFTER you sent the summary. Never auto-create.
- DETECT FEEDBACK passively: if customer says "shei product ta khub bhalo chilo" or "delivery late chilo" without being asked, capture it in feedback_extracted.
- DETECT EMOTION on every message and reflect it in tone (excited → match energy; frustrated → de-escalate, escalate to human).
- TAG BEHAVIOR over time: if they ask price first, add "price_sensitive". If they reply within seconds, "fast_converter". If they only ask but never buy, "browser". Use add_behavior_tags.
- DISCOUNTS: offer ONLY within the rules above and ONLY when triggers match (e.g., visible price objection, about to leave). Never lead with discount.
- Complaints / refund / missing order / angry → set should_escalate=true and send a calm holding reply.
- Comments (source=comment): also set a 1-line public_comment_reply ("DM kore dilam apu! 💕").
- NEVER make up prices/materials/delivery info that isn't in the knowledge above.
- Respond ONLY via the respond function. Always.`;
}
