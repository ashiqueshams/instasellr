
-- Create courier_settings table
CREATE TABLE public.courier_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'pathao',
  client_id text,
  client_secret text,
  client_email text,
  client_password text,
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  pathao_store_id integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(store_id, provider)
);

ALTER TABLE public.courier_settings ENABLE ROW LEVEL SECURITY;

-- RLS: only store owner can read
CREATE POLICY "Store owners can read courier settings"
ON public.courier_settings FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = courier_settings.store_id AND stores.user_id = auth.uid()
));

-- RLS: only store owner can insert
CREATE POLICY "Store owners can insert courier settings"
ON public.courier_settings FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = courier_settings.store_id AND stores.user_id = auth.uid()
));

-- RLS: only store owner can update
CREATE POLICY "Store owners can update courier settings"
ON public.courier_settings FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = courier_settings.store_id AND stores.user_id = auth.uid()
));

-- RLS: only store owner can delete
CREATE POLICY "Store owners can delete courier settings"
ON public.courier_settings FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = courier_settings.store_id AND stores.user_id = auth.uid()
));

-- Add pathao columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pathao_consignment_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient_city_id integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient_zone_id integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient_area_id integer;

-- Allow authenticated store owners to update their orders
CREATE POLICY "Store owners can update their orders"
ON public.orders FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.user_id = auth.uid()
));
