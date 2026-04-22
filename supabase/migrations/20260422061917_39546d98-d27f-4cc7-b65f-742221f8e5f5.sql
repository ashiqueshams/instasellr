
-- Lock down the integrations table to owners only
DROP POLICY IF EXISTS "Integrations are publicly readable" ON public.store_integrations;

CREATE POLICY "Store owners can read integrations"
ON public.store_integrations FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.stores
  WHERE stores.id = store_integrations.store_id AND stores.user_id = auth.uid()
));

-- Public view exposing only non-sensitive pixel IDs for the storefront to load
CREATE OR REPLACE VIEW public.store_pixels
WITH (security_invoker = true) AS
SELECT
  store_id,
  CASE WHEN meta_pixel_enabled THEN meta_pixel_id END AS meta_pixel_id,
  CASE WHEN google_ads_enabled THEN google_ads_conversion_id END AS google_ads_conversion_id,
  CASE WHEN google_ads_enabled THEN google_ads_conversion_label END AS google_ads_conversion_label,
  CASE WHEN tiktok_pixel_enabled THEN tiktok_pixel_id END AS tiktok_pixel_id
FROM public.store_integrations;

GRANT SELECT ON public.store_pixels TO anon, authenticated;

-- Fix function search_path
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
