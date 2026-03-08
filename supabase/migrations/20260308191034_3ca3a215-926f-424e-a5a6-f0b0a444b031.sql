
CREATE TABLE public.store_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.store_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store links are publicly readable" ON public.store_links FOR SELECT USING (true);
CREATE POLICY "Store owners can insert links" ON public.store_links FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_links.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Store owners can update links" ON public.store_links FOR UPDATE USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_links.store_id AND stores.user_id = auth.uid()));
CREATE POLICY "Store owners can delete links" ON public.store_links FOR DELETE USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_links.store_id AND stores.user_id = auth.uid()));
