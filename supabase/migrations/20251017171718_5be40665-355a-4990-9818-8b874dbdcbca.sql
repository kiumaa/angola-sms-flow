-- Fix check_rate_limit to handle read-only transactions
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  user_identifier text,
  action_type text,
  max_requests integer DEFAULT 10,
  time_window_minutes integer DEFAULT 5
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_count integer;
  is_readonly boolean := false;
BEGIN
  -- Check if transaction is read-only
  BEGIN
    is_readonly := current_setting('transaction_read_only', true) = 'on';
  EXCEPTION WHEN OTHERS THEN
    is_readonly := false;
  END;
  
  -- Count requests in time window
  SELECT COUNT(*) INTO request_count
  FROM admin_audit_logs 
  WHERE 
    details->>'user_identifier' = user_identifier
    AND action = action_type
    AND created_at > now() - (time_window_minutes || ' minutes')::interval;
  
  -- If limit exceeded, return false
  IF request_count >= max_requests THEN
    RETURN false;
  END IF;
  
  -- Only log if NOT in read-only transaction
  IF NOT is_readonly THEN
    INSERT INTO admin_audit_logs (
      admin_id,
      action,
      details,
      ip_address
    ) VALUES (
      auth.uid(),
      action_type,
      jsonb_build_object('user_identifier', user_identifier, 'timestamp', now()),
      inet_client_addr()
    );
  END IF;
  
  RETURN true;
END;
$$;