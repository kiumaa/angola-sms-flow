-- Fix Security Warning 1: Function Search Path
-- Update functions to have secure search path settings
CREATE OR REPLACE FUNCTION public.validate_admin_role_change(
  target_user_id UUID,
  admin_id UUID,
  new_role app_role
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public'
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

-- Fix other functions with proper search path
CREATE OR REPLACE FUNCTION public.sanitize_user_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.enhanced_audit_logging()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.check_admin_rate_limit()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public'
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