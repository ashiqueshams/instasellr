-- Allow the service role (edge functions) to update orders for download_count
CREATE POLICY "Service can update orders"
ON public.orders
FOR UPDATE
USING (true)
WITH CHECK (true);