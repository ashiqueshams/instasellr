ALTER TABLE public.stores 
  ADD COLUMN IF NOT EXISTS banner_mode text DEFAULT 'strip',
  ADD COLUMN IF NOT EXISTS card_style text DEFAULT 'card',
  ADD COLUMN IF NOT EXISTS social_position text DEFAULT 'header',
  ADD COLUMN IF NOT EXISTS footer_image_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS text_color text DEFAULT NULL;