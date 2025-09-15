-- Phase 1 Critical Security Fixes: Tighten RLS Policies

-- 1. Restrict credit_packages to authenticated users only
DROP POLICY IF EXISTS "Public can view active packages" ON public.credit_packages;
CREATE POLICY "Authenticated users can view active packages" 
ON public.credit_packages 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- 2. Restrict gateway_routing_rules to admins only
DROP POLICY IF EXISTS "Public can view active routing rules" ON public.gateway_routing_rules;
CREATE POLICY "Only admins can view routing rules" 
ON public.gateway_routing_rules 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Restrict country_pricing to authenticated users only
DROP POLICY IF EXISTS "Public can view active country pricing" ON public.country_pricing;
CREATE POLICY "Authenticated users can view country pricing" 
ON public.country_pricing 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- 4. Create restricted public brand settings view (only essential data)
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
  favicon_url text
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
    bs.favicon_url
  FROM public.brand_settings bs
  LIMIT 1;
$$;

-- 5. Restrict brand_settings table access to admins only
DROP POLICY IF EXISTS "Public can view basic brand info only" ON public.brand_settings;
CREATE POLICY "Only admins can access brand settings" 
ON public.brand_settings 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. Fix search_path for all functions (key security fix)
CREATE OR REPLACE FUNCTION public.sanitize_html_input(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE PARALLEL SAFE SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Remove tags HTML básicos e caracteres perigosos
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        COALESCE(input_text, ''),
        '<[^>]*>', '', 'g'  -- Remove HTML tags
      ),
      '[<>&"''`]', '', 'g'  -- Remove caracteres perigosos
    ),
    '\s+', ' ', 'g'  -- Normaliza espaços
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_single_primary_gateway()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.is_primary = true THEN
    -- Desativar todos os outros gateways como primário
    UPDATE public.sms_gateways 
    SET is_primary = false 
    WHERE id != NEW.id AND is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_brand_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;