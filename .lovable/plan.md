

# Bot Vision + Catalog Cards + Customers Tab — Build Plan

## What you picked
- **Carousels**: 10 cards + "See more" postback button (paginates next 10)
- **Out-of-stock fallback**: same category + ±30% price band → suggest 3 alternatives
- **Customers tab**: searchable list + profile drawer (history + orders)
- **Test panel**: must support all of the above (multi-image upload, see returned cards, click "See more", trigger fallback)

---

## 1. Vision: multi-image product recognition

**Today**: bot accepts `image_urls[]` but the prompt only nudges "identify the product". No explicit multi-product handling.

**New behavior**:
- Accept up to 5 images per message (Messenger sends each attachment; webhook batches them into one call already)
- Tell the model: "Each image may be a DIFFERENT product. Identify each separately. Match each to catalog by visual similarity (color, pattern, silhouette, category). Low confidence → say so, don't guess."
- New tool field: `matched_product_ids: string[]` (array, replaces single `matched_product_id`)
- Per-image confidence in `image_matches: [{image_index, product_id, confidence}]` so dashboard can show what matched what

**Model**: keep `google/gemini-2.5-flash` — it handles multi-image well and is cheap. Catalog already includes `image_url` per product so the model can compare.

---

## 2. Product cards in chat

**Messenger generic template** (carousel of cards with image, title, subtitle, buttons):

```json
{
  "attachment": {
    "type": "template",
    "payload": {
      "template_type": "generic",
      "elements": [
        { "title": "Cotton Kurti", "subtitle": "৳1,200", "image_url": "...",
          "buttons": [
            { "type": "postback", "title": "Order this", "payload": "ORDER:<product_id>" },
            { "type": "web_url", "title": "View", "url": "https://store/p/..." }
          ]
        }
      ]
    }
  }
}
```

**When bot sends cards** (new tool field `send_product_cards: string[]` of product IDs):
- Customer asks "shirt গুলো দেখান" / "show all kurtis" / category / "kichu suggest korun"
- Bot recognizes products from images
- Out-of-stock fallback (sends 3 similar)
- "See more" postback

**Server logic** (`chatbot-reply` returns):
```ts
{
  reply: "Apu egulo achhe 💕",
  product_cards: [{ id, name, price, image_url, in_stock }],
  pagination: { category: "kurti", offset: 10, total: 47, has_more: true } | null
}
```

**Webhook** (`meta-messenger-webhook`) takes `product_cards` and sends:
1. Text reply (`reply`)
2. Generic template carousel with up to 10 elements
3. If `pagination.has_more` → quick-reply button "আরও দেখুন (See more)" with payload `MORE:<category>:<offset>`

**Postback handling** (new in webhook):
- `MORE:kurti:10` → re-call `chatbot-reply` with synthetic context "show next 10 in category kurti, offset 10"
- `ORDER:<product_id>` → seeds `cart_draft.product_id` and bot asks for name/phone/address naturally

---

## 3. Out-of-stock fallback

In `chatbot-reply`, BEFORE calling the model, build a `candidates` array per intent:
- If model identifies a product that has `stock_quantity <= 0` OR no match found for an explicit ask → server-side query:
  ```sql
  SELECT * FROM products
  WHERE store_id = ? AND is_active AND stock_quantity > 0
    AND category = ?
    AND price BETWEEN target * 0.7 AND target * 1.3
  ORDER BY ABS(price - target) LIMIT 3
  ```
- Pass `fallback_suggestions: [...]` into the system prompt
- Model says: "Apu, ei product ta ekhon out of stock 😔 But same category te egulo achhe — apnar pochhondo hote pare:" and sets `send_product_cards` to the 3 IDs

Done deterministically in code, not left to the model to invent.

---

## 4. Category / collection requests

New intent in tool enum: `browse_category`.
- Model extracts `requested_category: string` (e.g. "kurti", "saree", "winter")
- Server queries: `SELECT * FROM products WHERE store_id=? AND is_active AND (category ILIKE %X% OR name ILIKE %X%) ORDER BY stock_quantity DESC, created_at DESC`
- Returns first 10 as cards + sets `pagination` if total > 10
- "See more" postback paginates server-side using offset

This stays out of the LLM — pure SQL, fast and reliable.

---

## 5. Customers tab in dashboard

New page `src/pages/DashboardCustomers.tsx`, route `/dashboard/customers`:

**List view** (table):
| Customer | Phone | Lifetime orders | Lifetime value | Last seen | Behavior tags | Last sentiment |

- Search box: name / phone / psid
- Filter chips: behavior tag (price_sensitive, fast_converter, browser, repeat_buyer…), platform (instagram/messenger), has_order (yes/no)
- Sort: most recent / highest value / most orders
- Click row → drawer

**Profile drawer** (right-side `Sheet`):
- Header: avatar (initial), name, phone, platform badge
- Stats cards: lifetime orders / value / first-seen / last-seen
- Behavior tag chips
- Preferences (size, color, categories, language)
- AI notes / cart_draft preview if active
- **Conversation history** tab: full message thread with sentiment chips per message
- **Orders** tab: list of orders linked by phone or psid (`source = chatbot` gets 🤖 badge)
- Action: "Open conversation in Inbox" → links to `/dashboard/inbox?conv=<id>`

Sidebar nav: add "Customers" link with `Users` icon between Inbox and Chatbot.

---

## 6. Test panel upgrades (`DashboardChatbot` Test tab)

Today's test panel sends one text message. Upgrade to:
- Multi-image upload (drag/drop up to 5 images, preview thumbnails)
- Show returned `product_cards` as a mini carousel below the bot reply (same visual as Messenger)
- "See more" button visible & functional (calls `chatbot-reply` again with offset)
- Display detected: language / sentiment / intent / matched product IDs / fallback used / pagination state
- Toggle: "simulate out of stock for this product" so owner can verify fallback without changing inventory
- Conversation persists in test session (so multi-turn confirm flow can be tested), but `test_mode=true` still skips DB writes & order creation

---

## 7. Schema changes (small)

```sql
-- Track pagination context per conversation so "See more" works after async messages
ALTER TABLE chatbot_conversations
  ADD COLUMN last_browse_context jsonb DEFAULT '{}'::jsonb;
-- shape: { category: 'kurti', offset: 10, total: 47, last_at: timestamp }

-- Optional: image-match audit (helps tune accuracy)
ALTER TABLE chatbot_messages
  ADD COLUMN image_matches jsonb DEFAULT '[]'::jsonb;
-- shape: [{ image_index: 0, product_id: 'uuid', confidence: 0.82 }]
```

No new tables needed.

---

## 8. Build order

1. **Migration** — add the 2 columns
2. **`chatbot-reply` upgrades**:
   - Multi-image prompt rewrite + `matched_product_ids` + `image_matches`
   - Server-side category browse query + pagination
   - Server-side out-of-stock fallback query
   - New tool fields: `send_product_cards`, `requested_category`, `pagination_request`
   - Return `product_cards` + `pagination` in response
3. **`meta-messenger-webhook` upgrades**:
   - Render generic-template carousel (up to 10)
   - Send "See more" quick-reply when `has_more`
   - Handle `MORE:` and `ORDER:` postbacks
4. **`DashboardCustomers.tsx`** — list + filters + drawer with history & orders
5. **`DashboardLayout`** sidebar — add Customers link
6. **`DashboardChatbot` Test tab** — multi-image upload, card preview, "See more" button, simulate-OOS toggle

---

## What I will NOT touch
- Existing storefront, checkout, courier, onboarding wizard
- Order creation logic (just the seed-from-postback)
- Discount rules, recovery, learning loop (already shipped)

Approve and I'll ship the migration + all 6 changes in one pass.

