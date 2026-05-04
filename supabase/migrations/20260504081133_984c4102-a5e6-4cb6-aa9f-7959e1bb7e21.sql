-- Add tags + popularity for smarter matching/sorting
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS popularity_score INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_tags ON public.products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_store_category ON public.products(store_id, category);

-- Carousel pagination state on conversations
ALTER TABLE public.chatbot_conversations
  ADD COLUMN IF NOT EXISTS last_carousel_query JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_carousel_page INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sent_product_ids UUID[] NOT NULL DEFAULT '{}';