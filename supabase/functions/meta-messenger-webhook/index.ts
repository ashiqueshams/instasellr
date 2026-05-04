// Meta webhook: handles GET verification + POST events for Instagram/Facebook
// Branches: messages (DM + story_reply), comments, story_mentions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FUNCTIONS_BASE = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GRAPH_BASE = "https://graph.facebook.com/v21.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);

  // ---------------- GET: webhook verification handshake ----------------
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token) {
      // Match against any store's verify token
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, SERVICE_KEY);
      const { data } = await supabase
        .from("chatbot_settings")
        .select("store_id")
        .eq("webhook_verify_token", token)
        .maybeSingle();
      if (data) {
        return new Response(challenge ?? "", { status: 200 });
      }
    }
    return new Response("Forbidden", { status: 403 });
  }

  // ---------------- POST: event delivery ----------------
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const payload = await req.json();
    // Always 200 quickly; process in background
    queueMicrotask(() => processPayload(payload).catch((e) => console.error("process error", e)));
    return new Response("EVENT_RECEIVED", { status: 200 });
  } catch (e) {
    console.error("webhook error", e);
    return new Response("ok", { status: 200 });
  }
});

async function processPayload(payload: any) {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, SERVICE_KEY);
  const entries = payload.entry ?? [];

  for (const entry of entries) {
    // Identify the store by page id (FB) or instagram business id (IG)
    const pageId = entry.id;
    const settings = await findStoreByPageId(supabase, pageId);
    if (!settings) {
      console.warn("No store matched for pageId", pageId);
      continue;
    }

    // Messages (DMs + story replies)
    for (const msg of entry.messaging ?? []) {
      await handleMessage(supabase, settings, msg, payload.object);
    }
    // Comments / feed events (Instagram/Facebook)
    for (const change of entry.changes ?? []) {
      if (change.field === "comments" || change.field === "feed") {
        await handleComment(supabase, settings, change.value, payload.object);
      }
    }
  }
}

async function findStoreByPageId(supabase: any, pageId: string) {
  const { data } = await supabase
    .from("chatbot_settings")
    .select("*")
    .or(`meta_page_id.eq.${pageId},instagram_business_id.eq.${pageId}`)
    .maybeSingle();
  return data;
}

async function handleMessage(supabase: any, settings: any, msg: any, platformObj: string) {
  if (msg.message?.is_echo) return; // ignore our own outgoing
  const senderId = msg.sender?.id;
  if (!senderId) return;

  // ---------- Postback ("See more" carousel button) ----------
  if (msg.postback?.payload) {
    try {
      const payload = JSON.parse(msg.postback.payload);
      if (payload.action === "see_more") {
        const platform = platformObj === "instagram" ? "instagram" : "facebook";
        const { data: conv } = await supabase
          .from("chatbot_conversations")
          .select("*")
          .eq("store_id", settings.store_id)
          .eq("platform", platform)
          .eq("customer_psid", senderId)
          .order("last_message_at", { ascending: false })
          .limit(1)
          .maybeSingle();
          if (conv) {
            const ai = await callBrain({
              store_id: settings.store_id,
              conversation_id: conv.id,
              customer_psid: senderId,
              platform,
              source: "dm",
              pagination: { query: payload.query, page: payload.page },
            });
            if (ai?.cards?.length) {
              await sendCarousel(settings, senderId, ai.cards, ai.more_available, ai.pagination_query, ai.next_page);
              await supabase
                .from("chatbot_conversations")
                .update({ last_carousel_page: payload.page, last_carousel_query: payload.query })
                .eq("id", conv.id);
            } else if (ai?.reply) {
              await sendDM(settings, senderId, ai.reply);
            }
          }
        return;
      }
    } catch { /* ignore malformed payload */ }
  }

  const isStoryReply = !!msg.message?.reply_to?.story;
  const isStoryMention = msg.message?.attachments?.some((a: any) => a.type === "story_mention");
  const source = isStoryMention ? "story_mention" : isStoryReply ? "story_reply" : "dm";
  const platform = platformObj === "instagram" ? "instagram" : "facebook";

  const text = msg.message?.text ?? "";
  const imageUrls: string[] =
    msg.message?.attachments?.filter((a: any) => a.type === "image" || a.type === "story_mention" || a.type === "share")
      .map((a: any) => a.payload?.url)
      .filter(Boolean) ?? [];

  const conv = await upsertConversation(supabase, {
    store_id: settings.store_id,
    platform,
    customer_psid: senderId,
    source,
    last_message_preview: text.slice(0, 100),
  });

  await supabase.from("chatbot_messages").insert({
    conversation_id: conv.id,
    direction: "in",
    sender: "customer",
    text,
    attachments: imageUrls.map((u) => ({ type: "image", url: u })),
    source_story_id: msg.message?.reply_to?.story?.id ?? null,
  });

  // Decide auto-reply based on source toggles
  if (!settings.enabled) return;
  if (source === "dm" && !settings.auto_reply_dms) return;
  if (source === "story_reply" && !settings.auto_reply_story_replies) return;
  if (source === "story_mention") {
    if (!settings.auto_thank_story_mentions) return;
    await sendDM(settings, senderId, "Thanks for the shoutout! 💕");
    await supabase.from("chatbot_messages").insert({
      conversation_id: conv.id,
      direction: "out",
      sender: "ai",
      text: "Thanks for the shoutout! 💕",
    });
    return;
  }

  // Get AI reply
  const ai = await callBrain({
    store_id: settings.store_id,
    conversation_id: conv.id,
    customer_psid: senderId,
    platform,
    text,
    image_urls: imageUrls,
    source,
  });
  if (!ai) return;

  if (ai.should_escalate || !ai.auto_send) {
    await supabase
      .from("chatbot_conversations")
      .update({ status: "needs_human", unread_count: (conv.unread_count ?? 0) + 1 })
      .eq("id", conv.id);
    return;
  }

  if (ai.reply) await sendDM(settings, senderId, ai.reply);
  if (ai.cards?.length) {
    await sendCarousel(settings, senderId, ai.cards, ai.more_available, ai.pagination_query, ai.next_page);
  }
  await supabase.from("chatbot_messages").insert({
    conversation_id: conv.id,
    direction: "out",
    sender: "ai",
    text: ai.reply,
    attachments: ai.cards?.length ? ai.cards.map((c: any) => ({ type: "card", ...c })) : [],
    detected_language: ai.detected_language,
    matched_product_id: ai.matched_product_id,
    confidence_score: ai.confidence,
  });
}

async function handleComment(supabase: any, settings: any, value: any, platformObj: string) {
  const commentId = value.id ?? value.comment_id;
  const text = value.text ?? value.message ?? "";
  const fromId = value.from?.id ?? value.sender_id;
  const postId = value.post_id ?? value.media?.id ?? value.parent_id;
  if (!commentId || !fromId) return;

  const platform = platformObj === "instagram" ? "instagram" : "facebook";

  const conv = await upsertConversation(supabase, {
    store_id: settings.store_id,
    platform,
    customer_psid: fromId,
    source: "comment",
    last_message_preview: text.slice(0, 100),
  });

  await supabase.from("chatbot_messages").insert({
    conversation_id: conv.id,
    direction: "in",
    sender: "customer",
    text,
    source_post_id: postId,
  });

  if (!settings.enabled || !settings.auto_reply_comments) return;

  // Optional cheap filter: only reply if it looks like a question/price keyword
  if (settings.comment_filter_questions_only && !looksLikeQuestion(text)) return;

  const ai = await callBrain({
    store_id: settings.store_id,
    conversation_id: conv.id,
    customer_psid: fromId,
    platform,
    text,
    source: "comment",
  });
  if (!ai) return;

  if (ai.should_escalate || !ai.auto_send) {
    await supabase
      .from("chatbot_conversations")
      .update({ status: "needs_human", unread_count: (conv.unread_count ?? 0) + 1 })
      .eq("id", conv.id);
    return;
  }

  // 1) Public comment reply
  if (ai.public_comment_reply) {
    await postCommentReply(settings, commentId, ai.public_comment_reply, platform);
  }
  // 2) Private DM via Private Replies API
  await sendPrivateReply(settings, commentId, ai.reply);

  await supabase.from("chatbot_messages").insert({
    conversation_id: conv.id,
    direction: "out",
    sender: "ai",
    text: ai.reply,
    detected_language: ai.detected_language,
    matched_product_id: ai.matched_product_id,
    confidence_score: ai.confidence,
    source_post_id: postId,
  });
}

function looksLikeQuestion(text: string) {
  if (!text) return false;
  const t = text.toLowerCase();
  if (t.includes("?")) return true;
  const keywords = ["price", "pp", "dp", "dam", "koto", "kotoy", "দাম", "কত", "available", "stock", "size", "delivery", "size", "color"];
  return keywords.some((k) => t.includes(k));
}

async function upsertConversation(supabase: any, c: {
  store_id: string;
  platform: string;
  customer_psid: string;
  source: string;
  last_message_preview: string;
}) {
  const { data: existing } = await supabase
    .from("chatbot_conversations")
    .select("*")
    .eq("store_id", c.store_id)
    .eq("platform", c.platform)
    .eq("customer_psid", c.customer_psid)
    .eq("source", c.source)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("chatbot_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: c.last_message_preview,
        unread_count: (existing.unread_count ?? 0) + 1,
      })
      .eq("id", existing.id);
    return existing;
  }
  const { data: created } = await supabase
    .from("chatbot_conversations")
    .insert({ ...c, last_message_at: new Date().toISOString(), unread_count: 1 })
    .select()
    .single();
  return created;
}

async function callBrain(input: any) {
  try {
    const res = await fetch(`${FUNCTIONS_BASE}/chatbot-reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
      body: JSON.stringify(input),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error("brain call failed", e);
    return null;
  }
}

async function sendDM(settings: any, recipientId: string, text: string) {
  const url = `${GRAPH_BASE}/me/messages?access_token=${settings.meta_page_access_token}`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
      messaging_type: "RESPONSE",
    }),
  });
}

async function postCommentReply(settings: any, commentId: string, text: string, _platform: string) {
  const url = `${GRAPH_BASE}/${commentId}/replies?access_token=${settings.meta_page_access_token}`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text }),
  });
}

async function sendPrivateReply(settings: any, commentId: string, text: string) {
  const url = `${GRAPH_BASE}/me/messages?access_token=${settings.meta_page_access_token}`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message: { text },
    }),
  });
}

async function sendCarousel(
  settings: any,
  recipientId: string,
  cards: any[],
  moreAvailable: boolean,
  paginationQuery: any,
  nextPage: number | null,
) {
  if (!cards?.length) return;
  const elements = cards.slice(0, 10).map((c: any) => ({
    title: `${c.name} — ৳${c.price}${c.in_stock ? "" : " (out of stock)"}`,
    subtitle: c.tagline || c.category || "",
    image_url: c.image_url || undefined,
    buttons: [
      {
        type: "postback",
        title: c.in_stock ? "Order this" : "Notify me",
        payload: JSON.stringify({ action: "select_product", product_id: c.id }),
      },
    ],
  }));

  const url = `${GRAPH_BASE}/me/messages?access_token=${settings.meta_page_access_token}`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: {
        attachment: {
          type: "template",
          payload: { template_type: "generic", elements },
        },
      },
    }),
  });

  if (moreAvailable && nextPage != null && paginationQuery) {
    // Send a quick-reply with "See more" button
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: "RESPONSE",
        message: {
          text: "Aro dekhben? 👇",
          quick_replies: [
            {
              content_type: "text",
              title: "See more",
              payload: JSON.stringify({ action: "see_more", query: paginationQuery, page: nextPage }),
            },
          ],
        },
      }),
    });
  }
}
