-- Drop and recreate the log_security_event function with proper search_path
DROP FUNCTION IF EXISTS public.log_security_event(text, uuid, jsonb);

CREATE OR REPLACE FUNCTION public.log_security_event(event_type text, user_id uuid, details jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    target_user_id,
    details,
    ip_address
  ) VALUES (
    COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    event_type,
    user_id,
    details,
    inet_client_addr()
  );
END;
$$;

-- Log this security enhancement
INSERT INTO admin_audit_logs (
  admin_id,
  action,
  details,
  ip_address
) VALUES (
  (SELECT user_id FROM user_roles WHERE role = 'admin'::app_role LIMIT 1),
  'security_functions_hardened',
  jsonb_build_object(
    'action', 'fixed_search_path_vulnerabilities',
    'functions_updated', ARRAY['log_profile_access_attempt', 'log_security_event'],
    'security_improvement', 'prevents_search_path_manipulation_attacks',
    'timestamp', now()
  ),
  inet_client_addr()
);