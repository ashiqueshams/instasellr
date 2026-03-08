
-- Add public read for orders (demo purposes - store owners + public demo)
DROP POLICY "Store owners can view orders" ON public.orders;
CREATE POLICY "Orders are readable by store owners or publicly for demo" ON public.orders 
  FOR SELECT USING (true);
