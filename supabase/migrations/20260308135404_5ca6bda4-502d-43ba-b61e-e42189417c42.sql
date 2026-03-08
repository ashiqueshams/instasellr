-- Create a table to store product files since storage.buckets schema is incomplete
CREATE TABLE IF NOT EXISTS public.product_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  store_id text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  file_data bytea NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_files ENABLE ROW LEVEL SECURITY;

-- Anyone can read (for downloads via edge function with service role)
CREATE POLICY "Service can read product files" ON public.product_files FOR SELECT TO service_role USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated can insert product files" ON public.product_files FOR INSERT TO authenticated WITH CHECK (true);

-- Authenticated users can delete
CREATE POLICY "Authenticated can delete product files" ON public.product_files FOR DELETE TO authenticated USING (true);