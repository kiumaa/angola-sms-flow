-- Fix debit_user_credits function to avoid admin validation trigger

-- First, let's modify the validation trigger to allow self-debit operations
CREATE OR REPLACE FUNCTION validate_admin_operations_credit_adjustments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow self-debit operations (when user is debiting their own credits for SMS sends)
  IF TG_TABLE_NAME = 'credit_adjustments' AND TG_OP = 'INSERT' THEN
    -- Check if this is a self-debit operation (user_id = admin_id and adjustment_type = 'sms_send')
    IF NEW.user_id = NEW.admin_id AND NEW.adjustment_type = 'sms_send' THEN
      RETURN NEW; -- Allow self-debit operations
    END IF;
  END IF;

  -- For other operations on credit_adjustments and other admin tables, require admin privileges
  IF TG_TABLE_NAME IN ('credit_adjustments', 'sms_configurations', 'gateway_overrides') THEN
    IF NOT (has_role(auth.uid(), 'admin'::app_role) AND validate_user_session()) THEN
      PERFORM log_security_event('unauthorized_admin_operation', auth.uid(), 
        jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP, 'blocked', true)
      );
      RAISE EXCEPTION 'Unauthorized: Admin privileges required with valid session';
    END IF;
    
    IF NOT enhanced_security_rate_limit('admin_operation', 50, 5) THEN
      RAISE EXCEPTION 'Admin operation rate limit exceeded';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Also fix the log_security_event function to handle NULL admin_id properly
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  user_identifier UUID DEFAULT NULL,
  details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if we have a valid admin_id
  IF COALESCE(user_identifier, auth.uid()) IS NOT NULL THEN
    INSERT INTO admin_audit_logs (
      admin_id,
      action,
      target_user_id,
      details,
      ip_address
    ) VALUES (
      COALESCE(user_identifier, auth.uid()),
      'security_event_' || event_type,
      user_identifier,
      details || jsonb_build_object('timestamp', now(), 'session_id', auth.jwt() ->> 'session_id'),
      inet_client_addr()
    );
  END IF;
END;
$$;