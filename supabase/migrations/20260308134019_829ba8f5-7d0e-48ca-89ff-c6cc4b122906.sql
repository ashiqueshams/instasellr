
-- Add download columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS download_token text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS download_expires_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS download_count integer DEFAULT 0;
