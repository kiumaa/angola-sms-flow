-- ============================================
-- MIGRATION: Fix Service Role Security Bypass (Fixed)
-- ============================================

-- 1. Drop existing function first
DROP FUNCTION IF EXISTS public.log_security_event(text, uuid, jsonb);

-- 2. Drop existing service_role bypass policies
DROP POLICY IF EXISTS "Service role full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access to contacts" ON public.contacts;

-- 3. Create audit function for service role access
CREATE OR REPLACE FUNCTION public.audit_service_role_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('role') = 'service_role' THEN
    -- Check rate limit
    IF NOT enhanced_security_rate_limit('service_role_access', 1000, 1) THEN
      RAISE EXCEPTION 'Service role rate limit exceeded';
    END IF;
    
    -- Log the access
    INSERT INTO admin_audit_logs (admin_id, action, details, ip_address)
    VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      'service_role_' || TG_TABLE_NAME || '_' || TG_OP,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', now(),
        'record_id', COALESCE(NEW.id, OLD.id)
      ),
      inet_client_addr()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4. Create triggers
CREATE TRIGGER audit_service_role_profiles
  BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION audit_service_role_access();

CREATE TRIGGER audit_service_role_contacts
  BEFORE INSERT OR UPDATE OR DELETE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION audit_service_role_access();

-- 5. Create granular policies
CREATE POLICY "Service role can create profiles during registration"
ON public.profiles FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can update profile credits"
ON public.profiles FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role can read profiles"
ON public.profiles FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can manage contacts for imports"
ON public.contacts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. Recreate log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  affected_user_id uuid,
  event_details jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO admin_audit_logs (admin_id, action, target_user_id, details, ip_address)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    event_type,
    affected_user_id,
    event_details,
    inet_client_addr()
  );
END;
$$;

-- 7. Create session validation
CREATE OR REPLACE FUNCTION public.validate_user_session()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_valid boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND user_status = 'active'
  ) INTO session_valid;
  
  IF NOT session_valid THEN
    PERFORM log_security_event('invalid_session', auth.uid(), jsonb_build_object('timestamp', now()));
  END IF;
  
  RETURN session_valid;
END;
$$;