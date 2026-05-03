-- ============ CUSTOMER PROFILES ============
CREATE TABLE public.customer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  customer_psid text NOT NULL,
  platform text NOT NULL DEFAULT 'instagram',
  name text DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  preferred_language text DEFAULT 'auto',
  lifetime_orders integer NOT NULL DEFAULT 0,
  lifetime_value numeric NOT NULL DEFAULT 0,
  last_order_at timestamptz,
  behavior_tags text[] NOT NULL DEFAULT '{}',
  preferred_categories text[] NOT NULL DEFAULT '{}',
  preferred_price_min numeric,
  preferred_price_max numeric,
  preferred_size text,
  preferred_color text,
  conversion_factors jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_sentiment text,
  last_intent text,
  last_seen_product_id uuid,
  notes text DEFAULT '',
  silent_since timestamptz,
  recovery_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, platform, customer_psid)
);

CREATE INDEX idx_customer_profiles_store ON public.customer_profiles(store_id);
CREATE INDEX idx_customer_profiles_silent ON public.customer_profiles(store_id, silent_since) WHERE silent_since IS NOT NULL;

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read customer profiles" ON public.customer_profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = customer_profiles.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners insert customer profiles" ON public.customer_profiles
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = customer_profiles.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners update customer profiles" ON public.customer_profiles
  FOR UPDATE USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = customer_profiles.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners delete customer profiles" ON public.customer_profiles
  FOR DELETE USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = customer_profiles.store_id AND stores.user_id = auth.uid()));

CREATE TRIGGER trg_customer_profiles_updated
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ DISCOUNT RULES ============
CREATE TABLE public.chatbot_discount_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT false,
  max_discount_percent integer NOT NULL DEFAULT 10,
  min_order_value numeric NOT NULL DEFAULT 0,
  trigger_signals text[] NOT NULL DEFAULT '{price_objection,about_to_leave}',
  max_uses_per_customer integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_discount_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read discount rules" ON public.chatbot_discount_rules
  FOR SELECT USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_discount_rules.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners insert discount rules" ON public.chatbot_discount_rules
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_discount_rules.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners update discount rules" ON public.chatbot_discount_rules
  FOR UPDATE USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_discount_rules.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners delete discount rules" ON public.chatbot_discount_rules
  FOR DELETE USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_discount_rules.store_id AND stores.user_id = auth.uid()));

CREATE TRIGGER trg_discount_rules_updated
  BEFORE UPDATE ON public.chatbot_discount_rules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ PLAYBOOK (versioned per store) ============
CREATE TABLE public.chatbot_playbook (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  strategy jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary text DEFAULT '',
  sample_size integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_playbook_store_active ON public.chatbot_playbook(store_id, is_active, version DESC);

ALTER TABLE public.chatbot_playbook ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read playbook" ON public.chatbot_playbook
  FOR SELECT USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_playbook.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners insert playbook" ON public.chatbot_playbook
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_playbook.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners update playbook" ON public.chatbot_playbook
  FOR UPDATE USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_playbook.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners delete playbook" ON public.chatbot_playbook
  FOR DELETE USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_playbook.store_id AND stores.user_id = auth.uid()));

-- ============ LEARNING EVENTS ============
CREATE TABLE public.chatbot_learning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  conversation_id uuid,
  customer_psid text,
  outcome text NOT NULL, -- 'won' | 'lost' | 'abandoned' | 'escalated'
  order_value numeric DEFAULT 0,
  discount_offered_percent numeric DEFAULT 0,
  time_to_first_reply_seconds integer,
  behavior_tags text[] DEFAULT '{}',
  conversation_snapshot jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_learning_events_store_created ON public.chatbot_learning_events(store_id, created_at DESC);

ALTER TABLE public.chatbot_learning_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read learning events" ON public.chatbot_learning_events
  FOR SELECT USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_learning_events.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners insert learning events" ON public.chatbot_learning_events
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = chatbot_learning_events.store_id AND stores.user_id = auth.uid()));

-- ============ CONVERSATION ENRICHMENTS ============
ALTER TABLE public.chatbot_conversations
  ADD COLUMN IF NOT EXISTS current_intent text,
  ADD COLUMN IF NOT EXISTS cart_draft jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sales_stage text NOT NULL DEFAULT 'browsing',
  ADD COLUMN IF NOT EXISTS feedback_text text,
  ADD COLUMN IF NOT EXISTS feedback_sentiment text,
  ADD COLUMN IF NOT EXISTS customer_profile_id uuid;

ALTER TABLE public.chatbot_messages
  ADD COLUMN IF NOT EXISTS sentiment text,
  ADD COLUMN IF NOT EXISTS intent text;

ALTER TABLE public.chatbot_settings
  ADD COLUMN IF NOT EXISTS brain_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS recovery_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recovery_delay_hours integer NOT NULL DEFAULT 4;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'storefront';