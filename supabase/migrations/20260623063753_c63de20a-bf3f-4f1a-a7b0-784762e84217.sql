
-- ===== stores =====
DROP POLICY IF EXISTS "Public can read all stores" ON public.stores;
DROP POLICY IF EXISTS "Stores are publicly readable" ON public.stores;
CREATE POLICY "Anon read public store fields" ON public.stores FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated read all stores" ON public.stores FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.stores FROM anon;
GRANT SELECT (
  id, slug, name, bio, avatar_initials, accent_color, social_links, created_at,
  font_heading, font_body, layout, logo_url, banner_url, theme, background_color,
  banner_mode, card_style, social_position, footer_image_url, text_color,
  social_links_color, preferred_language
) ON public.stores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;

-- ===== reviews =====
DROP POLICY IF EXISTS "Reviews are publicly readable" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
CREATE POLICY "Anon read public review fields" ON public.reviews FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated read all reviews" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon submit review" ON public.reviews FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated submit review" ON public.reviews FOR INSERT TO authenticated WITH CHECK (true);

REVOKE SELECT, INSERT ON public.reviews FROM anon;
GRANT SELECT (
  id, store_id, customer_name, rating, review_text, created_at,
  owner_response, owner_response_at, is_visible
) ON public.reviews TO anon;
GRANT INSERT (store_id, customer_name, customer_email, rating, review_text)
  ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

-- ===== referral_campaigns =====
DROP POLICY IF EXISTS "Referral campaigns are publicly readable" ON public.referral_campaigns;
CREATE POLICY "Anon read active campaign codes" ON public.referral_campaigns
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Owners read campaigns" ON public.referral_campaigns
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.stores
            WHERE stores.id = referral_campaigns.store_id
              AND stores.user_id = auth.uid())
  );

REVOKE SELECT ON public.referral_campaigns FROM anon;
GRANT SELECT (id, store_id, code, discount_percent, is_active)
  ON public.referral_campaigns TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_campaigns TO authenticated;
GRANT ALL ON public.referral_campaigns TO service_role;

-- ===== store_integrations: allow anon to read only pixel columns =====
CREATE POLICY "Anon read pixel info" ON public.store_integrations
  FOR SELECT TO anon USING (true);

REVOKE SELECT ON public.store_integrations FROM anon;
GRANT SELECT (
  store_id, meta_pixel_id, meta_pixel_enabled,
  google_ads_conversion_id, google_ads_conversion_label, google_ads_enabled,
  tiktok_pixel_id, tiktok_pixel_enabled
) ON public.store_integrations TO anon;

-- ===== store_pixels view: security invoker =====
DROP VIEW IF EXISTS public.store_pixels;
CREATE VIEW public.store_pixels WITH (security_invoker = true) AS
SELECT store_id,
  CASE WHEN meta_pixel_enabled THEN meta_pixel_id ELSE NULL END AS meta_pixel_id,
  CASE WHEN google_ads_enabled THEN google_ads_conversion_id ELSE NULL END AS google_ads_conversion_id,
  CASE WHEN google_ads_enabled THEN google_ads_conversion_label ELSE NULL END AS google_ads_conversion_label,
  CASE WHEN tiktok_pixel_enabled THEN tiktok_pixel_id ELSE NULL END AS tiktok_pixel_id
FROM public.store_integrations;
GRANT SELECT ON public.store_pixels TO anon, authenticated;

-- ===== handle_new_user revoke =====
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- ===== storage: remove broad listing on images bucket =====
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
CREATE POLICY "Owners list their images" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.stores WHERE user_id = auth.uid()
    )
  );

-- ===== realtime.messages: restrict subscriptions =====
DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can send realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated can read realtime messages" ON realtime.messages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can send realtime messages" ON realtime.messages
  FOR INSERT TO authenticated WITH CHECK (true);
