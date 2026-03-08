
-- Add product_type to products (digital or physical)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'digital';

-- Add shipping fields to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_city text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_state text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_zip text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_country text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_items jsonb DEFAULT '[]'::jsonb;
