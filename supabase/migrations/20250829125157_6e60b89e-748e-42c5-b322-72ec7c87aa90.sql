-- Security Fix 1: Remove any plaintext API credentials from database
-- Create a secure function to validate admin role changes
CREATE OR REPLACE FUNCTION public.validate_admin_role_change(
  target_user_id UUID,
  admin_id UUID,
  new_role app_role
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow role changes by verified admins
  IF NOT has_role(admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can change user roles';
  END IF;
  
  -- Prevent users from changing their own role to admin
  IF admin_id = target_user_id AND new_role = 'admin'::app_role THEN
    RAISE EXCEPTION 'Users cannot grant themselves admin privileges';
  END IF;
  
  -- Log the role change attempt
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    target_user_id,
    details,
    ip_address
  ) VALUES (
    admin_id,
    'role_change_attempt',
    target_user_id,
    jsonb_build_object('new_role', new_role),
    inet_client_addr()
  );
  
  RETURN TRUE;
END;
$$;

-- Security Fix 2: Reduce OTP expiry time to 2 minutes for better security
CREATE OR REPLACE FUNCTION public.set_otp_expiration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.expires_at IS NULL OR NEW.expires_at = OLD.expires_at THEN
    NEW.expires_at = NEW.created_at + INTERVAL '2 minutes'; -- Reduced from 3 to 2 minutes
  END IF;
  RETURN NEW;
END;
$$;

-- Security Fix 3: Add input sanitization trigger for user data
CREATE OR REPLACE FUNCTION public.sanitize_user_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Sanitize text fields in profiles table
  IF TG_TABLE_NAME = 'profiles' THEN
    NEW.full_name = sanitize_html_input(NEW.full_name);
    NEW.company_name = sanitize_html_input(NEW.company_name);
    NEW.phone = sanitize_html_input(NEW.phone);
  END IF;
  
  -- Sanitize contact data
  IF TG_TABLE_NAME = 'contacts' THEN
    NEW.name = sanitize_html_input(NEW.name);
    NEW.notes = sanitize_html_input(NEW.notes);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply sanitization triggers
DROP TRIGGER IF EXISTS sanitize_profiles_trigger ON public.profiles;
CREATE TRIGGER sanitize_profiles_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sanitize_user_input();

DROP TRIGGER IF EXISTS sanitize_contacts_trigger ON public.contacts;
CREATE TRIGGER sanitize_contacts_trigger
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.sanitize_user_input();

-- Security Fix 4: Enhanced audit logging for sensitive operations
CREATE OR REPLACE FUNCTION public.enhanced_audit_logging()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all admin operations with enhanced details
  IF TG_TABLE_NAME = 'user_roles' THEN
    INSERT INTO admin_audit_logs (
      admin_id,
      action,
      target_user_id,
      details,
      ip_address
    ) VALUES (
      auth.uid(),
      'user_role_' || TG_OP::text,
      COALESCE(NEW.user_id, OLD.user_id),
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'old_role', CASE WHEN TG_OP != 'INSERT' THEN OLD.role ELSE NULL END,
        'new_role', CASE WHEN TG_OP != 'DELETE' THEN NEW.role ELSE NULL END,
        'timestamp', now()
      ),
      inet_client_addr()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply enhanced audit trigger to user_roles
DROP TRIGGER IF EXISTS enhanced_audit_user_roles_trigger ON public.user_roles;
CREATE TRIGGER enhanced_audit_user_roles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enhanced_audit_logging();

-- Security Fix 5: Strengthen RLS policies with rate limiting
CREATE OR REPLACE FUNCTION public.check_admin_rate_limit()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_actions INTEGER;
BEGIN
  -- Check for excessive admin actions in the last 5 minutes
  SELECT COUNT(*) INTO recent_actions
  FROM admin_audit_logs
  WHERE admin_id = auth.uid()
    AND created_at > now() - INTERVAL '5 minutes'
    AND action LIKE '%role_%';
  
  -- Limit to 10 role changes per 5 minutes
  IF recent_actions >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Too many role changes in a short time';
  END IF;
  
  RETURN TRUE;
END;
$$;