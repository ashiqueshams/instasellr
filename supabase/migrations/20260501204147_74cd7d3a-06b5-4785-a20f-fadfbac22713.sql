ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en';

-- Mark existing stores (with at least 1 product) as already onboarded so we don't trap returning users in the wizard
UPDATE public.stores s
SET onboarding_completed = true
WHERE EXISTS (SELECT 1 FROM public.products p WHERE p.store_id = s.id);