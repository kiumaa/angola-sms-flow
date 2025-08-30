-- Fix the audit trigger to handle system operations
DROP TRIGGER IF EXISTS audit_sms_configurations ON public.sms_configurations;

-- Update the audit function to handle null auth.uid() gracefully
CREATE OR REPLACE FUNCTION public.audit_sms_config_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_admin_id uuid;
BEGIN
  -- Get admin_id, using the first admin if auth.uid() is null (for system operations)
  current_admin_id := auth.uid();
  
  IF current_admin_id IS NULL THEN
    -- For system operations, use the first available admin
    SELECT user_id INTO current_admin_id 
    FROM user_roles 
    WHERE role = 'admin'::app_role 
    LIMIT 1;
  END IF;
  
  -- Only log if we have a valid admin_id
  IF current_admin_id IS NOT NULL THEN
    INSERT INTO admin_audit_logs (
      admin_id,
      action,
      details,
      ip_address
    ) VALUES (
      current_admin_id,
      'sms_config_' || TG_OP::text,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'gateway_name', COALESCE(NEW.gateway_name, OLD.gateway_name),
        'credentials_encrypted', COALESCE(NEW.credentials_encrypted, OLD.credentials_encrypted),
        'has_sensitive_data', CASE 
          WHEN NEW.api_token_secret IS NOT NULL OR OLD.api_token_secret IS NOT NULL THEN true
          ELSE false
        END,
        'system_operation', auth.uid() IS NULL,
        'timestamp', now()
      ),
      inet_client_addr()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate the trigger
CREATE TRIGGER audit_sms_configurations
  AFTER INSERT OR UPDATE OR DELETE ON public.sms_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_sms_config_changes();

-- Now run the migration function to update existing configurations
SELECT migrate_sms_credentials_to_secrets();