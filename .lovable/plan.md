

# Handling Story Replies & Comments

Short answer: **yes, both are fully supported** by the same Meta webhook setup we already planned. They just arrive as different event types and need slightly different handling. Here's how they fit into the chatbot.

## What Meta sends us

Once your Meta App is approved with `instagram_manage_messages` + `instagram_manage_comments` + `pages_manage_engagement`, the **same webhook URL** receives three event types:

| Event | Where it comes from | Meta webhook field |
|---|---|---|
| **DM** | Direct message in inbox | `messages` |
| **Story reply** | Customer replies to your IG story | `messages` (with `reply_to.story` attached) |
| **Comment** | Customer comments on your IG post or FB post | `comments` (Instagram) / `feed` (Facebook) |

So one webhook handles everything — we just branch on the event type.

## How each one is handled

### 1. Story replies → treat exactly like DMs
Story replies land in your IG inbox as a normal message, but Meta attaches the original story's media URL. The bot:
- Downloads the story image (already a product photo your team posted)
- Runs it through the same vision model used for customer screenshots
- Identifies the product, replies with price + info in the DM thread
- The reply arrives in the customer's DM inbox — exactly what they expect

No separate UI needed. Story replies appear in the same Inbox page as DMs, with a small "↩ Story reply" badge and a thumbnail of the story they replied to.

### 2. Comments → two-step "Comment + DM" flow

This is the standard Bangladesh-shop playbook and Meta explicitly supports it:

**Step A — Public reply on the post**
A short, friendly comment-reply: *"DM kore dilam apu! 💕"* / *"Check your DM!"*
This boosts post engagement (Meta algorithm loves comment activity) and signals to other lurkers that you respond.

**Step B — Private DM to the commenter**
Send the actual price/answer privately via the **Private Replies API** (one free DM per comment, allowed by Meta within 7 days of the comment). The full answer with product details lands in their inbox.

The bot decides automatically:
- Comment looks like a price/product question (any language) → do both A + B
- Comment is just an emoji, "nice", spam, or unrelated → skip silently (configurable in Chatbot Settings)
- Comment is negative/complaint → skip auto-reply, mark as **"Needs Human"** in dashboard

### 3. Story mentions (bonus)
When a customer mentions your account in *their* story, Meta sends a `story_mention` event. The bot sends an auto-thank-you DM ("Thanks for the shoutout! 💕") — toggleable in settings.

## Dashboard additions

Two small additions to the plan I already presented:

**Inbox page** gets three filter tabs at the top:
- **All** · **DMs** · **Story Replies** · **Comments**

Each conversation shows a source badge so you instantly know where it came from. Comments thread into the Inbox too, with a link back to the original post.

**Chatbot Settings** gets one new section: **Auto-engage rules**
- ☐ Auto-reply to DMs (default on)
- ☐ Auto-reply to story replies (default on)
- ☐ Auto-reply to comments — public + private DM (default on)
- ☐ Auto-thank story mentions (default off)
- Comment filter: only reply when comment contains a question or price keyword (default on)

## Database additions

Just one extra column on the tables I already proposed:

- `chatbot_conversations.source` — enum: `dm` | `story_reply` | `comment` | `story_mention`
- `chatbot_messages.source_post_id` — IG/FB post ID (for comments) so we can link back
- `chatbot_messages.source_story_id` — IG story ID (for story replies/mentions)

Everything else from the original plan stays identical.

## Edge function additions

The webhook function I planned (`meta-messenger-webhook`) gains two more branches:

```text
incoming event
   ├── messages         → DM / story reply pipeline (existing)
   ├── comments         → comment pipeline:
   │                       1. classify intent
   │                       2. post public reply via Graph API
   │                       3. send private DM via Private Replies API
   │                       4. log both in Inbox
   └── story_mentions   → optional auto-thank pipeline
```

Same AI brain (`chatbot-reply`), same knowledge base, same Bangla/Benglish/English handling. Just three entry points feeding it.

## Meta permissions checklist (updated)

When you submit your Meta App for review, request these scopes together (one review covers everything):

- `pages_messaging` — send DMs
- `pages_messaging_subscriptions` — receive DM webhooks
- `instagram_manage_messages` — IG DMs + story replies + story mentions
- `instagram_manage_comments` — read comments + post comment replies
- `pages_manage_engagement` — Facebook comment replies
- `pages_show_list` + `instagram_basic` + `pages_manage_metadata` — required base scopes

Submitting them all at once means **one review, one approval**, and DMs + story replies + comments all go live together.

## Build phase impact

No change to phasing:
- **Phase 1** (no Meta approval needed): everything testable in the dashboard "Test the bot" panel — including pasting a sample story screenshot or comment text to preview the bot's reply.
- **Phase 2** (after Meta approval): all three channels (DMs + story replies + comments) activate simultaneously the moment you paste in your Page Access Token.

