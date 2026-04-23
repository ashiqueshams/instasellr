-- Product material fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS material text DEFAULT '',
  ADD COLUMN IF NOT EXISTS care_instructions text DEFAULT '';

-- Chatbot settings
CREATE TABLE IF NOT EXISTS public.chatbot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  meta_page_id text,
  meta_page_access_token text,
  instagram_business_id text,
  webhook_verify_token text DEFAULT encode(gen_random_bytes(16), 'hex'),
  tone text NOT NULL DEFAULT 'friendly',
  default_language text NOT NULL DEFAULT 'auto',
  greeting_message text DEFAULT 'Assalamu alaikum! Kemon achen? Ki janen chan? 💕',
  fallback_message text DEFAULT 'Apu ektu wait korun, amader team ekhuni reply dibe! 💕',
  auto_reply_dms boolean NOT NULL DEFAULT true,
  auto_reply_story_replies boolean NOT NULL DEFAULT true,
  auto_reply_comments boolean NOT NULL DEFAULT true,
  auto_thank_story_mentions boolean NOT NULL DEFAULT false,
  comment_filter_questions_only boolean NOT NULL DEFAULT true,
  escalation_threshold numeric NOT NULL DEFAULT 0.6,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read chatbot settings" ON public.chatbot_settings FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_settings.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners insert chatbot settings" ON public.chatbot_settings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_settings.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners update chatbot settings" ON public.chatbot_settings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_settings.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners delete chatbot settings" ON public.chatbot_settings FOR DELETE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_settings.store_id AND stores.user_id = auth.uid()));

CREATE TRIGGER trg_chatbot_settings_updated
  BEFORE UPDATE ON public.chatbot_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Chatbot FAQs
CREATE TABLE IF NOT EXISTS public.chatbot_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  keywords text[] DEFAULT '{}',
  language text NOT NULL DEFAULT 'auto',
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "FAQs publicly readable" ON public.chatbot_faqs FOR SELECT USING (true);
CREATE POLICY "Owners insert FAQs" ON public.chatbot_faqs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_faqs.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners update FAQs" ON public.chatbot_faqs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_faqs.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners delete FAQs" ON public.chatbot_faqs FOR DELETE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_faqs.store_id AND stores.user_id = auth.uid()));

-- Chatbot conversations
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  platform text NOT NULL DEFAULT 'instagram',
  source text NOT NULL DEFAULT 'dm',
  customer_psid text NOT NULL,
  customer_name text DEFAULT '',
  customer_profile_pic text,
  status text NOT NULL DEFAULT 'active',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text DEFAULT '',
  unread_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, platform, customer_psid, source)
);

ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read conversations" ON public.chatbot_conversations FOR SELECT
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_conversations.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners update conversations" ON public.chatbot_conversations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_conversations.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners insert conversations" ON public.chatbot_conversations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_conversations.store_id AND stores.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_store_lastmsg ON public.chatbot_conversations (store_id, last_message_at DESC);

-- Chatbot messages
CREATE TABLE IF NOT EXISTS public.chatbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
  direction text NOT NULL,
  sender text NOT NULL DEFAULT 'customer',
  text text DEFAULT '',
  attachments jsonb DEFAULT '[]'::jsonb,
  detected_language text,
  matched_product_id uuid,
  confidence_score numeric,
  source_post_id text,
  source_story_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read messages" ON public.chatbot_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chatbot_conversations c
    JOIN stores s ON s.id = c.store_id
    WHERE c.id = chatbot_messages.conversation_id AND s.user_id = auth.uid()
  ));
CREATE POLICY "Owners insert messages" ON public.chatbot_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM chatbot_conversations c
    JOIN stores s ON s.id = c.store_id
    WHERE c.id = chatbot_messages.conversation_id AND s.user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation ON public.chatbot_messages (conversation_id, created_at);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chatbot_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chatbot_messages;