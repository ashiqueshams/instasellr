
-- reviews INSERT must target a real store
DROP POLICY IF EXISTS "Anon submit review" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated submit review" ON public.reviews;
CREATE POLICY "Anon submit review for real store" ON public.reviews
  FOR INSERT TO anon WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = reviews.store_id)
  );
CREATE POLICY "Authenticated submit review for real store" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = reviews.store_id)
  );

-- orders INSERT must target a real store
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders for real store" ON public.orders
  FOR INSERT TO anon, authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = orders.store_id)
  );

-- service_role bypasses RLS already; drop the redundant always-true UPDATE policy
DROP POLICY IF EXISTS "Service role can update orders" ON public.orders;

-- referral_clicks must reference an active campaign
DROP POLICY IF EXISTS "Anyone can record clicks" ON public.referral_clicks;
CREATE POLICY "Anyone can record clicks for active campaign" ON public.referral_clicks
  FOR INSERT TO anon, authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.referral_campaigns c
      WHERE c.id = referral_clicks.campaign_id
        AND c.is_active = true
    )
  );
