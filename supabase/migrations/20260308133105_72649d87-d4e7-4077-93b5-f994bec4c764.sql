
-- Create stores table
CREATE TABLE public.stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_initials TEXT DEFAULT '',
  accent_color TEXT DEFAULT '#ff4545',
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tagline TEXT DEFAULT '',
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  emoji TEXT DEFAULT '🎨',
  color TEXT DEFAULT '#6C5CE7',
  category TEXT DEFAULT '',
  file_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'delivered')),
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Stores: public read, owner write
CREATE POLICY "Stores are publicly readable" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Owners can update their store" ON public.stores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners can insert their store" ON public.stores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Products: public read, owner write via store
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);
CREATE POLICY "Store owners can insert products" ON public.products FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid()));
CREATE POLICY "Store owners can update products" ON public.products FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid()));
CREATE POLICY "Store owners can delete products" ON public.products FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid()));

-- Orders: public insert (customers place orders), owner read via store
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Store owners can view orders" ON public.orders FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid()));

-- Indexes
CREATE INDEX idx_stores_slug ON public.stores(slug);
CREATE INDEX idx_products_store ON public.products(store_id);
CREATE INDEX idx_orders_store ON public.orders(store_id);
