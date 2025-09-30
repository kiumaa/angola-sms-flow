-- PHASE 1: RLS & Permissions Security Hardening
-- Fixes: PUBLIC_USER_DATA, EXPOSED_SENSITIVE_DATA warnings

-- ============================================================================
-- 1. CREATE SAFE PUBLIC VIEW FOR PROFILES
-- ============================================================================

DROP VIEW IF EXISTS public.safe_profiles CASCADE;

CREATE VIEW public.safe_profiles AS
SELECT 
  user_id,
  created_at,
  user_status,
  CASE 
    WHEN user_status = 'active' THEN 'Ativo'
    WHEN user_status = 'inactive' THEN 'Inativo'
    ELSE 'Desconhecido'
  END as status_display
FROM public.profiles
WHERE user_status = 'active';

ALTER VIEW public.safe_profiles OWNER TO postgres;
REVOKE ALL ON public.safe_profiles FROM public;
GRANT SELECT ON public.safe_profiles TO anon, authenticated;

COMMENT ON VIEW public.safe_profiles IS 'Safe public view of profiles without PII';

-- ============================================================================
-- 2. CREATE PII MASKING FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.mask_email(email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF email IS NULL OR length(email) < 3 THEN
    RETURN 'masked@email.com';
  END IF;
  RETURN substring(email from 1 for 2) || '***@' || split_part(email, '@', 2);
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_phone(phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF phone IS NULL OR length(phone) < 4 THEN
    RETURN '***-****';
  END IF;
  RETURN '***-' || right(phone, 4);
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_name(name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF name IS NULL OR length(name) = 0 THEN
    RETURN '[REDACTED]';
  END IF;
  RETURN substring(name from 1 for 1) || '***';
END;
$$;

-- ============================================================================
-- 3. CREATE AUDIT LOGGING FOR PII ACCESS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pii_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  accessor_id uuid,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  column_accessed text NOT NULL,
  access_type text NOT NULL CHECK (access_type IN ('read', 'update', 'delete')),
  ip_address inet,
  user_agent text,
  masked_value text
);

ALTER TABLE public.pii_access_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view PII access audit"
ON public.pii_access_audit
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 4. REVOKE PUBLIC PERMISSIONS
-- ============================================================================

REVOKE ALL ON public.profiles FROM anon, public;
REVOKE ALL ON public.contacts FROM anon, public;

-- ============================================================================
-- 5. CREATE STRICT RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "profiles_block_anonymous" ON public.profiles;
CREATE POLICY "profiles_block_anonymous"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "contacts_block_anonymous" ON public.contacts;
CREATE POLICY "contacts_block_anonymous"
ON public.contacts
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- ============================================================================
-- 6. ADD INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pii_audit_accessed_at 
ON public.pii_access_audit(accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_pii_audit_accessor 
ON public.pii_access_audit(accessor_id, accessed_at DESC);

-- Log completion
INSERT INTO public.admin_audit_logs (admin_id, action, details, ip_address)
VALUES (
  COALESCE((SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid),
  'security_phase1_completed',
  '{"phase": 1, "description": "RLS and permissions hardening", "warnings_fixed": ["PUBLIC_USER_DATA", "EXPOSED_SENSITIVE_DATA"]}'::jsonb,
  inet_client_addr()
);