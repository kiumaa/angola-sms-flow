-- Fix audit logging to avoid FK violations during unauthenticated/system flows
-- and make data access validation tolerant when auth.uid() is NULL

-- 1) Safer audit logging function
CREATE OR REPLACE FUNCTION public.log_security_event(event_type text, user_id uuid, details jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  effective_admin uuid;
BEGIN
  -- Prefer explicit user_id (caller) then auth.uid(); if none, skip logging
  effective_admin := COALESCE(user_id, auth.uid());

  IF effective_admin IS NULL THEN
    -- Avoid inserting a row with an invalid admin_id that could violate FKs
    RETURN;
  END IF;

  BEGIN
    INSERT INTO admin_audit_logs (
      admin_id,
      action,
      target_user_id,
      details,
      ip_address
    ) VALUES (
      effective_admin,
      event_type,
      user_id,
      details,
      inet_client_addr()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Never break the main transaction because of audit logging
    RETURN;
  END;
END;
$function$;

-- 2) Make enhanced_data_access_validation tolerant to unauthenticated flows
CREATE OR REPLACE FUNCTION public.enhanced_data_access_validation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip for unauthenticated contexts (e.g., system or initial user creation flows)
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Log potential security violations for sensitive tables
  IF TG_TABLE_NAME IN ('contacts', 'profiles', 'transactions', 'campaign_targets', 'sms_logs') THEN
    -- Validate session for all sensitive data operations (except service role)
    IF NOT validate_user_session() AND current_setting('role') != 'service_role' THEN
      PERFORM log_security_event('invalid_session_data_access', auth.uid(), 
        jsonb_build_object(
          'table', TG_TABLE_NAME,
          'operation', TG_OP,
          'timestamp', now(),
          'blocked', true
        )
      );
      RAISE EXCEPTION 'Invalid session: Access denied to sensitive data';
    END IF;

    -- Rate limit sensitive operations
    IF TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
      IF NOT enhanced_security_rate_limit('sensitive_data_operation', 100, 60) THEN
        PERFORM log_security_event('rate_limit_sensitive_data', auth.uid(), 
          jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'blocked', true
          )
        );
        RAISE EXCEPTION 'Rate limit exceeded for sensitive data operations';
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;