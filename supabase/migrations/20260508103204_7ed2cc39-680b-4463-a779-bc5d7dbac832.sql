ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_popular boolean NOT NULL DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_products_is_popular ON public.products (store_id, is_popular) WHERE is_popular = true;