-- Referral campaigns (one per influencer per store)
CREATE TABLE public.referral_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  influencer_name TEXT NOT NULL,
  code TEXT NOT NULL,
  commission_percent NUMERIC NOT NULL DEFAULT 10 CHECK (commission_percent >= 0 AND commission_percent <= 100),
  discount_percent NUMERIC NOT NULL DEFAULT 10 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, code)
);

CREATE INDEX idx_referral_campaigns_store ON public.referral_campaigns(store_id);
CREATE INDEX idx_referral_campaigns_code ON public.referral_campaigns(store_id, code) WHERE is_active = true;

ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referral campaigns are publicly readable"
  ON public.referral_campaigns FOR SELECT
  USING (true);

CREATE POLICY "Store owners can insert campaigns"
  ON public.referral_campaigns FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = referral_campaigns.store_id AND stores.user_id = auth.uid()));

CREATE POLICY "Store owners can update campaigns"
  ON public.referral_campaigns FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = referral_campaigns.store_id AND stores.user_id = auth.uid()));

CREATE POLICY "Store owners can delete campaigns"
  ON public.referral_campaigns FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = referral_campaigns.store_id AND stores.user_id = auth.uid()));

-- Click tracking
CREATE TABLE public.referral_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.referral_campaigns(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referral_clicks_campaign ON public.referral_clicks(campaign_id);
CREATE INDEX idx_referral_clicks_store ON public.referral_clicks(store_id);

ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record clicks"
  ON public.referral_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Store owners can view clicks"
  ON public.referral_clicks FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = referral_clicks.store_id AND stores.user_id = auth.uid()));

-- Attribute orders to referrals
ALTER TABLE public.orders
  ADD COLUMN referral_campaign_id UUID REFERENCES public.referral_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN referral_code TEXT,
  ADD COLUMN referral_commission_amount NUMERIC DEFAULT 0;

CREATE INDEX idx_orders_referral ON public.orders(referral_campaign_id) WHERE referral_campaign_id IS NOT NULL;