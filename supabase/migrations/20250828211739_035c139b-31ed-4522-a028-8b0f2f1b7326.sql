-- Security Fix: Remove Security Definer View Risk
-- The public_brand_settings view was created with postgres ownership, creating a security definer risk
-- This fix removes the view and implements a more secure approach

-- Drop the problematic view (ignore if doesn't exist)
DROP VIEW IF EXISTS public.public_brand_settings;

-- Create a secure function to get public brand settings safely
-- This function uses SECURITY INVOKER to run with caller's privileges, not owner's
CREATE OR REPLACE FUNCTION public.get_public_brand_settings()
RETURNS TABLE(
  site_title text,
  site_tagline text,
  light_primary text,
  light_secondary text,
  light_bg text,
  light_text text,
  dark_primary text,
  dark_secondary text,
  dark_bg text,
  dark_text text,
  font_family text,
  logo_light_url text,
  logo_dark_url text,
  favicon_url text,
  og_image_url text,
  seo_title text,
  seo_description text,
  seo_canonical text,
  seo_twitter text
)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- This ensures the function runs with the caller's privileges, not the owner's
SET search_path = 'public'
AS $function$
  SELECT 
    bs.site_title,
    bs.site_tagline,
    bs.light_primary,
    bs.light_secondary,
    bs.light_bg,
    bs.light_text,
    bs.dark_primary,
    bs.dark_secondary,
    bs.dark_bg,
    bs.dark_text,
    bs.font_family,
    bs.logo_light_url,
    bs.logo_dark_url,
    bs.favicon_url,
    bs.og_image_url,
    bs.seo_title,
    bs.seo_description,
    bs.seo_canonical,
    bs.seo_twitter
  FROM public.brand_settings bs
  LIMIT 1;
$function$;

-- Grant execute permission to public roles for the safe function
GRANT EXECUTE ON FUNCTION public.get_public_brand_settings() TO anon, authenticated;