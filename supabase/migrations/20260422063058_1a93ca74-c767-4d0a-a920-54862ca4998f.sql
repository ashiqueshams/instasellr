ALTER VIEW public.store_pixels SET (security_invoker = false);
GRANT SELECT ON public.store_pixels TO anon, authenticated;