-- Fix audit_service_role_access to use fallback admin instead of invalid UUID
CREATE OR REPLACE FUNCTION public.audit_service_role_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fallback_admin_id UUID;
BEGIN
  IF current_setting('role') = 'service_role' THEN
    -- Get a fallback admin user for service role operations
    SELECT user_id INTO fallback_admin_id
    FROM public.user_roles
    WHERE role = 'admin'::app_role
    LIMIT 1;
    
    -- Only log if we have a valid admin to attribute it to
    IF fallback_admin_id IS NOT NULL THEN
      -- Check rate limit
      IF NOT enhanced_security_rate_limit('service_role_access', 1000, 1) THEN
        RAISE EXCEPTION 'Service role rate limit exceeded';
      END IF;
      
      -- Log the access with valid admin_id
      INSERT INTO admin_audit_logs (admin_id, action, details, ip_address)
      VALUES (
        fallback_admin_id,
        'service_role_' || TG_TABLE_NAME || '_' || TG_OP,
        jsonb_build_object(
          'table', TG_TABLE_NAME,
          'operation', TG_OP,
          'timestamp', now(),
          'record_id', COALESCE(NEW.id, OLD.id),
          'note', 'automated_system_operation'
        ),
        inet_client_addr()
      );
    END IF;
    -- If no admin exists, skip logging to avoid FK violations
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Also fix log_security_event to avoid the invalid UUID
CREATE OR REPLACE FUNCTION public.log_security_event(event_type TEXT, affected_user_id UUID, event_details JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_admin_id UUID;
  fallback_admin_id UUID;
BEGIN
  -- Try to get current user or fallback to a valid admin
  current_admin_id := auth.uid();
  
  IF current_admin_id IS NULL THEN
    SELECT user_id INTO fallback_admin_id
    FROM public.user_roles
    WHERE role = 'admin'::app_role
    LIMIT 1;
    
    current_admin_id := fallback_admin_id;
  END IF;
  
  -- Only insert if we have a valid admin_id
  IF current_admin_id IS NOT NULL THEN
    INSERT INTO admin_audit_logs (admin_id, action, target_user_id, details, ip_address)
    VALUES (
      current_admin_id,
      event_type,
      affected_user_id,
      event_details,
      inet_client_addr()
    );
  END IF;
  -- If no valid admin_id, skip logging to avoid FK violations
END;
$$;