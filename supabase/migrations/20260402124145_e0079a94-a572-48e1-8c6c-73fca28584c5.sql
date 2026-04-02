ALTER TABLE public.reviews ADD COLUMN owner_response TEXT DEFAULT NULL;
ALTER TABLE public.reviews ADD COLUMN owner_response_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

CREATE POLICY "Store owners can update their reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = reviews.store_id AND stores.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM stores WHERE stores.id = reviews.store_id AND stores.user_id = auth.uid()
));