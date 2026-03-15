
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT null,
  ADD COLUMN IF NOT EXISTS compare_at_price numeric DEFAULT null,
  ADD COLUMN IF NOT EXISTS weight numeric DEFAULT null;
