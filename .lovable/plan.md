# AI Sales Brain — Build Plan

## What you picked

- **Order placement**: Confirm-only (bot collects → summary → "confirm" → pending order in dashboard)
- **Memory**: Per-customer profile + behavior signals + store-wide learning loop + sentiment/intent tagging
- **Discounts**: Within owner-set rules (max %, min order, trigger conditions)
- **Outreach**: Cart/conversation recovery (single nudge inside Meta's 24h window)

---

## 1. Database (one migration)

`**customer_profiles**` — one row per (store, customer_psid). Auto-built/updated by the bot.

- name, phone, address, city, preferred_language
- Meta ID if DM is from Meta(Instagram, facebook)
- lifetime_orders, lifetime_value, last_order_at
- behavior_tags `text[]` — `price_sensitive`, `fast_converter`, `image_first`, `browser`, `complainer`, `repeat_buyer`
- preferred_categories, preferred_price_range, preferred_size, preferred_color
- conversion_factors `jsonb` — `{ converted_with_discount: 2, converted_with_fast_reply: 4, abandoned: 1 }`
- last_sentiment, last_intent, last_seen_product_id
- silent_since (for recovery), recovery_sent_at

`**chatbot_conversations**` — add: `current_intent`, `cart_draft jsonb` (items being collected), `sales_stage` (browsing/considering/objection/collecting_info/confirming/won/lost), `feedback_text`, `feedback_sentiment`

`**chatbot_messages**` — add: `sentiment` (positive/neutral/negative/frustrated/excited), `intent` (price/material/objection/ready_to_buy/feedback/complaint/greeting/other)

`**chatbot_discount_rules**` — owner-controlled rails

- max_discount_percent, min_order_value
- trigger_signals `text[]` — `price_objection`, `about_to_leave`, `repeat_customer`, `high_value_cart`
- max_uses_per_customer, is_active

`**chatbot_playbook**` — store-wide learned strategies (rewritten weekly by learning loop)

- store_id, version, strategy `jsonb` (best openers, objection handlers, discount triggers that worked), generated_at, sample_size

`**chatbot_learning_events**` — every won/lost outcome with the conversation snapshot, used as training data for the weekly playbook rewrite.

All tables: RLS scoped to store owner.

---

## 2. Edge functions

### `chatbot-reply` (rewritten — the brain)

On every incoming message:

1. Load: settings, products, FAQs, delivery, **customer_profile, conversation history (last 20 msgs), active playbook, discount rules**
2. One AI call (Gemini 2.5 Flash) using **structured tool calling** with one mega-tool returning:
  - `sentiment`, `intent`, `detected_language`
  - `reply` (in customer's language, tone-adapted to profile)
  - `sales_stage_update`
  - `cart_draft_update` — items/qty bot extracted
  - `customer_profile_update` — name, phone, address, behavior signals it noticed
  - `feedback_extracted` — passive feedback detection (no asking)
  - `should_offer_discount` + `discount_percent` (clamped to rules)
  - `should_request_confirmation` (when cart_draft has all 4 fields → bot sends summary)
  - `should_create_order` (only when customer says confirm/হ্যাঁ/ok/done after summary)
  - `confidence`, `should_escalate`
3. Apply updates: write profile, conversation, message tags
4. If `should_create_order` → call internal `create-order` with collected cart + customer info, mark conversation `won`, log learning_event
5. If escalated or low confidence → mark `needs_human`

System prompt is built from: tone settings + active playbook strategy + this customer's profile + discount rules + product catalog + FAQ + delivery. So every reply is personalized.

### `chatbot-recovery` (new, scheduled)

- Runs every 30 min via pg_cron
- Finds conversations where `sales_stage IN (collecting_info, considering)`, last customer message 2–18h ago, no recovery_sent_at, still inside Meta 24h window
- Generates ONE personalized nudge via AI ("Apu, ekhono ki kichu jiggesh korar ache? 💕") tuned to their profile (offer discount if they're `price_sensitive` and rules allow)
- Sends DM, logs as `out` message, sets `recovery_sent_at`

### `chatbot-learn` (new, scheduled weekly)

- Runs Sunday 2am via pg_cron
- For each store: pulls last 7 days of `chatbot_learning_events` (won + lost)
- Sends to Gemini 2.5 Pro with prompt: "Analyze these conversations. What openers, objection responses, and discount timings led to wins vs losses? Output a strategy JSON."
- Saves new row in `chatbot_playbook` (version++). Brain auto-uses latest version next reply.
- Skipped if <10 events (not enough signal yet).

### `meta-messenger-webhook` (small patch)

- After saving incoming message, also update `customer_profiles.silent_since = null` and `last_message_at`
- On outbound from owner (manual reply in inbox) → log as learning signal

---

## 3. Dashboard UI

### `DashboardChatbot.tsx` — add 3 tabs (existing FAQ/Settings stay)

- **Brain** — toggle AI brain on/off, view current playbook version + summary ("This week your bot learned: customers convert 34% better when you mention free Inside-Dhaka delivery early"), force-rerun learning button
- **Discount rules** — form for max %, min order, trigger checkboxes, max uses per customer
- **Recovery** — toggle on/off, preview the nudge template, view recovery stats (sent / converted)

### `DashboardInbox.tsx` — enhance per conversation

- Customer profile sidebar: name, phone, lifetime value, behavior tags (chips), last sentiment, preferred categories
- Each message shows sentiment emoji + intent chip
- Cart draft panel when bot is collecting — owner sees what bot has so far, can intervene
- "Won by AI" / "Lost" badges on closed conversations

### `DashboardOrders.tsx` — small badge

- Orders created by bot show a 🤖 "AI-closed" pill so you can see the bot's revenue contribution

---

## 4. Order creation safety

- Bot only calls `create-order` after explicit confirm in last user message
- Order goes in as `pending` with `source: 'chatbot'` (new column on orders) — your existing approval flow still gates dispatch
- Pricing always re-validated server-side in `create-order` (already the case) — bot can't fake prices
- Discount, if applied, validated against `chatbot_discount_rules` server-side before order insert

---

## 5. Learning loop — concretely

Every closed conversation logs:

- snapshot (last 10 msgs), outcome (won/lost), order value if won, behavior tags at time of close, was discount offered, time-to-first-reply

Weekly job aggregates → AI rewrites playbook → next week's replies use new strategy. Bot literally gets smarter every Sunday for each store independently.

---

## 6. What I will NOT touch

- Existing storefront, checkout UI, Pathao, pixel tracking, reviews, referrals
- Meta webhook verification & token handling (already working)
- The existing FAQ/settings UI (additive only)

---

## 7. Build order

1. Migration (all new tables + column adds)
2. Rewrite `chatbot-reply` brain
3. Update `meta-messenger-webhook` (profile updates + learning event logging)
4. Build `chatbot-recovery` + `chatbot-learn` + cron schedules
5. Wire `DashboardInbox` profile sidebar + cart draft panel
6. Add Brain / Discount rules / Recovery tabs to `DashboardChatbot`
7. Add 🤖 badge on orders + `source` column

Approve and I'll ship it end-to-end in one pass.