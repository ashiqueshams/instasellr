
CREATE TABLE public.store_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL UNIQUE,
  meta_pixel_id text,
  meta_pixel_enabled boolean NOT NULL DEFAULT false,
  meta_capi_token text,
  meta_capi_enabled boolean NOT NULL DEFAULT false,
  meta_test_event_code text,
  google_ads_conversion_id text,
  google_ads_conversion_label text,
  google_ads_enabled boolean NOT NULL DEFAULT false,
  tiktok_pixel_id text,
  tiktok_pixel_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Integrations are publicly readable"
ON public.store_integrations FOR SELECT
USING (true);

CREATE POLICY "Store owners can insert integrations"
ON public.store_integrations FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.stores
  WHERE stores.id = store_integrations.store_id AND stores.user_id = auth.uid()
));

CREATE POLICY "Store owners can update integrations"
ON public.store_integrations FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.stores
  WHERE stores.id = store_integrations.store_id AND stores.user_id = auth.uid()
));

CREATE POLICY "Store owners can delete integrations"
ON public.store_integrations FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.stores
  WHERE stores.id = store_integrations.store_id AND stores.user_id = auth.uid()
));

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER store_integrations_updated_at
BEFORE UPDATE ON public.store_integrations
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
