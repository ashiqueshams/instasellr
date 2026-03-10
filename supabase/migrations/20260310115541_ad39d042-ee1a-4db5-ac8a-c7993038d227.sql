
-- Fix 1: Orders SELECT - restrict to store owners only
DROP POLICY IF EXISTS "Orders are readable by store owners or publicly for demo" ON public.orders;
CREATE POLICY "Store owners can view their orders" ON public.orders
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = orders.store_id AND stores.user_id = auth.uid()));

-- Fix 2: Orders UPDATE - restrict to service_role only
DROP POLICY IF EXISTS "Service can update orders" ON public.orders;
CREATE POLICY "Service role can update orders" ON public.orders
  FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix 3: Storage - scope image update/delete to file owner
DROP POLICY IF EXISTS "Authenticated users can update their images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their images" ON storage.objects;

CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'images' AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.stores WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'images' AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.stores WHERE user_id = auth.uid()
  ));
