-- Phase 4: Remove redundant policies and strengthen service role restrictions

-- 1. Remove redundant 'Block all anonymous access' policies
-- These are redundant because other policies already restrict to authenticated users

-- Profiles table - keep only the essential blocking policy
DROP POLICY IF EXISTS "Block all anonymous access to profiles" ON public.profiles;

-- SMTP Settings table - keep only the essential blocking policy  
DROP POLICY IF EXISTS "Block all anonymous access to SMTP settings" ON public.smtp_settings;

-- Site Settings table - keep only the essential blocking policy
DROP POLICY IF EXISTS "Block all anonymous access to site settings" ON public.site_settings;

-- 2. Add validation trigger for contacts service role operations
-- This ensures service role INSERT operations are properly validated

CREATE OR REPLACE FUNCTION public.validate_service_role_contact_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only validate when called by service role
  IF current_setting('role') = 'service_role' THEN
    -- Ensure required fields are present
    IF NEW.user_id IS NULL OR NEW.account_id IS NULL OR NEW.phone IS NULL THEN
      RAISE EXCEPTION 'Service role contact insert must include user_id, account_id, and phone';
    END IF;
    
    -- Ensure user_id matches account_id
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = NEW.user_id 
        AND id = NEW.account_id
    ) THEN
      RAISE EXCEPTION 'Service role contact insert: user_id does not match account_id';
    END IF;
    
    -- Log the service role operation for audit
    INSERT INTO admin_audit_logs (admin_id, action, target_user_id, details, ip_address)
    VALUES (
      '00000000-0000-0000-0000-000000000000'::uuid,
      'service_role_contact_insert',
      NEW.user_id,
      jsonb_build_object(
        'contact_id', NEW.id,
        'account_id', NEW.account_id,
        'timestamp', now()
      ),
      inet_client_addr()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply trigger to contacts table
DROP TRIGGER IF EXISTS validate_service_role_contact_operations ON public.contacts;
CREATE TRIGGER validate_service_role_contact_operations
  BEFORE INSERT ON public.contacts
  FOR EACH ROW
  WHEN (current_setting('role') = 'service_role')
  EXECUTE FUNCTION public.validate_service_role_contact_insert();

-- 3. Add comment to document SMTP password encryption requirement
COMMENT ON COLUMN public.smtp_settings.password_encrypted IS 
  'CRITICAL SECURITY: This field must be encrypted at application layer before storage. Never store plaintext passwords.';

-- 4. Create audit trigger for SMTP settings changes
CREATE OR REPLACE FUNCTION public.audit_smtp_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all SMTP configuration changes
  INSERT INTO admin_audit_logs (admin_id, action, details, ip_address)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'smtp_settings_' || TG_OP::text,
    jsonb_build_object(
      'setting_id', COALESCE(NEW.id, OLD.id),
      'host', CASE WHEN NEW IS NOT NULL THEN NEW.host ELSE OLD.host END,
      'operation', TG_OP,
      'timestamp', now()
    ),
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_smtp_settings_changes ON public.smtp_settings;
CREATE TRIGGER audit_smtp_settings_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.smtp_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_smtp_changes();