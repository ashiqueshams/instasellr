
CREATE TABLE public.delivery_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  label text NOT NULL,
  cost numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Delivery options are publicly readable"
ON public.delivery_options FOR SELECT TO public
USING (true);

CREATE POLICY "Store owners can insert delivery options"
ON public.delivery_options FOR INSERT TO public
WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = delivery_options.store_id AND stores.user_id = auth.uid()));

CREATE POLICY "Store owners can update delivery options"
ON public.delivery_options FOR UPDATE TO public
USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = delivery_options.store_id AND stores.user_id = auth.uid()));

CREATE POLICY "Store owners can delete delivery options"
ON public.delivery_options FOR DELETE TO public
USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = delivery_options.store_id AND stores.user_id = auth.uid()));
