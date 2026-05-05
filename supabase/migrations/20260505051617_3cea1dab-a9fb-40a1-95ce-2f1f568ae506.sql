-- Categories table for storefront
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_store ON public.categories(store_id, position);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories publicly readable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Owners insert categories" ON public.categories FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = categories.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners update categories" ON public.categories FOR UPDATE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = categories.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Owners delete categories" ON public.categories FOR DELETE
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = categories.store_id AND stores.user_id = auth.uid()));

-- Add category_id + position to products
ALTER TABLE public.products
  ADD COLUMN category_id UUID,
  ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_products_category ON public.products(category_id, position);
