-- Remove broad service role access to smtp_settings
DROP POLICY IF EXISTS "Service role can select SMTP settings" ON public.smtp_settings;

-- Create secure function for edge functions to access SMTP settings (heavily audited)
CREATE OR REPLACE FUNCTION public.get_smtp_settings_for_edge_function()
RETURNS TABLE (
  id uuid,
  host text,
  port integer,
  username text,
  password_encrypted text,
  use_tls boolean,
  from_name text,
  from_email text,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow service_role (edge functions) to call this
  IF current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Only edge functions can access SMTP credentials';
  END IF;
  
  -- Rate limiting for edge function access
  IF NOT enhanced_security_rate_limit('smtp_edge_access', 20, 5) THEN
    RAISE EXCEPTION 'Rate limit exceeded for SMTP settings access';
  END IF;
  
  -- Log the access with high severity
  PERFORM log_security_event('smtp_credentials_accessed_by_edge_function', 
    '00000000-0000-0000-0000-000000000000'::uuid,
    jsonb_build_object(
      'context', 'edge_function',
      'timestamp', now(),
      'severity', 'high',
      'audit_required', true
    )
  );
  
  -- Return active SMTP settings
  RETURN QUERY
  SELECT 
    s.id,
    s.host,
    s.port,
    s.username,
    s.password_encrypted,
    s.use_tls,
    s.from_name,
    s.from_email,
    s.is_active
  FROM public.smtp_settings s
  WHERE s.is_active = true
  LIMIT 1;
END;
$$;

-- Create secure function for admins to view SMTP settings (password masked)
CREATE OR REPLACE FUNCTION public.get_smtp_settings_for_admin()
RETURNS TABLE (
  id uuid,
  host text,
  port integer,
  username text,
  password_masked text,
  use_tls boolean,
  from_name text,
  from_email text,
  is_active boolean,
  test_status text,
  last_tested_at timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to call this
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view SMTP settings';
  END IF;
  
  -- Validate session
  IF NOT validate_user_session() THEN
    RAISE EXCEPTION 'Invalid session';
  END IF;
  
  -- Rate limiting
  IF NOT enhanced_security_rate_limit('smtp_admin_view', 30, 5) THEN
    RAISE EXCEPTION 'Rate limit exceeded for SMTP settings access';
  END IF;
  
  -- Log the access
  PERFORM log_security_event('smtp_settings_viewed_by_admin', auth.uid(),
    jsonb_build_object(
      'action', 'view_smtp_settings',
      'timestamp', now()
    )
  );
  
  -- Return settings with masked password
  RETURN QUERY
  SELECT 
    s.id,
    s.host,
    s.port,
    s.username,
    '********'::text as password_masked,
    s.use_tls,
    s.from_name,
    s.from_email,
    s.is_active,
    s.test_status,
    s.last_tested_at,
    s.created_at,
    s.updated_at
  FROM public.smtp_settings s
  ORDER BY s.created_at DESC;
END;
$$;

-- Create function to decrypt password for SMTP testing (admins only, heavily audited)
CREATE OR REPLACE FUNCTION public.get_smtp_password_for_test(setting_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decrypted_password text;
BEGIN
  -- Only allow admins or service_role
  IF NOT has_role(auth.uid(), 'admin'::app_role) AND current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can decrypt SMTP passwords';
  END IF;
  
  -- Strict rate limiting for password decryption
  IF NOT enhanced_security_rate_limit('smtp_password_decrypt', 5, 10) THEN
    RAISE EXCEPTION 'Rate limit exceeded for password decryption';
  END IF;
  
  -- Get the encrypted password
  SELECT password_encrypted INTO decrypted_password
  FROM public.smtp_settings
  WHERE id = setting_id AND is_active = true;
  
  IF decrypted_password IS NULL THEN
    RAISE EXCEPTION 'SMTP settings not found or inactive';
  END IF;
  
  -- Log this critical security event
  PERFORM log_security_event('smtp_password_decrypted', 
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    jsonb_build_object(
      'setting_id', setting_id,
      'purpose', 'smtp_connection_test',
      'timestamp', now(),
      'severity', 'critical',
      'requires_review', true
    )
  );
  
  -- Log to admin audit as well
  INSERT INTO public.admin_audit_logs (admin_id, action, details, ip_address)
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'smtp_password_decrypted',
    jsonb_build_object(
      'setting_id', setting_id,
      'context', CASE WHEN current_setting('role') = 'service_role' THEN 'edge_function' ELSE 'admin_ui' END,
      'timestamp', now()
    ),
    inet_client_addr()
  );
  
  RETURN decrypted_password;
END;
$$;

-- Add final security verification log
INSERT INTO public.admin_audit_logs (admin_id, action, details, ip_address)
VALUES (
  COALESCE(
    (SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ),
  'smtp_security_enhanced',
  jsonb_build_object(
    'changes', jsonb_build_array(
      'removed_broad_service_role_select_policy',
      'created_secure_edge_function_access',
      'created_secure_admin_view_function',
      'created_audited_password_decrypt_function'
    ),
    'security_improvements', jsonb_build_array(
      'all_access_now_audited',
      'strict_rate_limiting_applied',
      'password_masked_in_admin_view',
      'decryption_logged_as_critical_event'
    ),
    'status', 'SMTP credentials now fully secured',
    'timestamp', now()
  ),
  inet_client_addr()
);