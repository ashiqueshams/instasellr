
-- Add image_url to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;

-- Add customization columns to stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS font_heading text DEFAULT 'Syne';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS font_body text DEFAULT 'Manrope';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS layout text DEFAULT 'list';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS theme text DEFAULT 'light';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS background_color text;

-- Create bundles table
CREATE TABLE IF NOT EXISTS bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  emoji text DEFAULT '🔥',
  color text DEFAULT '#1a1a1a',
  discount_percent integer DEFAULT 30,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bundles are publicly readable" ON bundles FOR SELECT USING (true);
CREATE POLICY "Store owners can insert bundles" ON bundles FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = bundles.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Store owners can update bundles" ON bundles FOR UPDATE USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = bundles.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Store owners can delete bundles" ON bundles FOR DELETE USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = bundles.store_id AND stores.user_id = auth.uid()));

-- Create bundle_items table
CREATE TABLE IF NOT EXISTS bundle_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(bundle_id, product_id)
);

ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bundle items are publicly readable" ON bundle_items FOR SELECT USING (true);
CREATE POLICY "Store owners can insert bundle items" ON bundle_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM bundles JOIN stores ON stores.id = bundles.store_id WHERE bundles.id = bundle_items.bundle_id AND stores.user_id = auth.uid()));
CREATE POLICY "Store owners can delete bundle items" ON bundle_items FOR DELETE USING (EXISTS (SELECT 1 FROM bundles JOIN stores ON stores.id = bundles.store_id WHERE bundles.id = bundle_items.bundle_id AND stores.user_id = auth.uid()));

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Storage policies for images bucket
CREATE POLICY "Anyone can view images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update their images" ON storage.objects FOR UPDATE USING (bucket_id = 'images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete their images" ON storage.objects FOR DELETE USING (bucket_id = 'images' AND auth.role() = 'authenticated');
