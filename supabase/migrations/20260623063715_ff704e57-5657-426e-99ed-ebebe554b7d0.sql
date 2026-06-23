
DROP POLICY IF EXISTS "Authenticated can delete product files" ON public.product_files;
DROP POLICY IF EXISTS "Authenticated can insert product files" ON public.product_files;

CREATE POLICY "Owners insert product files" ON public.product_files
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id::text = product_files.product_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners delete product files" ON public.product_files
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id::text = product_files.product_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners select product files" ON public.product_files
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.stores s ON s.id = p.store_id
      WHERE p.id::text = product_files.product_id AND s.user_id = auth.uid()
    )
  );

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
