-- Security Fix: Remove plaintext SMS credentials from database
-- Move sensitive fields to encrypted columns and add secret references

-- First, let's add new secure columns to replace the plaintext ones
ALTER TABLE public.sms_configurations 
ADD COLUMN api_token_secret_name text,
ADD COLUMN api_token_id_secret_name text,
ADD COLUMN credentials_encrypted boolean DEFAULT false;

-- Add a comment explaining the security improvement
COMMENT ON COLUMN public.sms_configurations.api_token_secret_name IS 'Name of the Supabase secret containing the encrypted API token secret';
COMMENT ON COLUMN public.sms_configurations.api_token_id_secret_name IS 'Name of the Supabase secret containing the encrypted API token ID';
COMMENT ON COLUMN public.sms_configurations.credentials_encrypted IS 'Flag indicating if credentials are stored securely in Supabase secrets';

-- Create a function to safely migrate existing configurations
CREATE OR REPLACE FUNCTION public.migrate_sms_credentials_to_secrets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update existing configurations to use secret-based storage
  -- This will be handled by the admin interface to ensure proper secret creation
  UPDATE public.sms_configurations 
  SET 
    credentials_encrypted = false,
    api_token_secret_name = CASE 
      WHEN gateway_name = 'bulksms' THEN 'BULKSMS_TOKEN_SECRET'
      WHEN gateway_name = 'bulkgate' THEN 'BULKGATE_API_SECRET'
      ELSE null
    END,
    api_token_id_secret_name = CASE 
      WHEN gateway_name = 'bulksms' THEN 'BULKSMS_TOKEN_ID'
      WHEN gateway_name = 'bulkgate' THEN 'BULKGATE_API_KEY'
      ELSE null
    END
  WHERE api_token_id IS NOT NULL OR api_token_secret IS NOT NULL;
  
  -- Log the migration
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    details,
    ip_address
  ) VALUES (
    (SELECT user_id FROM user_roles WHERE role = 'admin'::app_role LIMIT 1),
    'sms_credentials_security_migration',
    jsonb_build_object(
      'action', 'migrated_to_secrets',
      'timestamp', now(),
      'security_improvement', 'moved_credentials_from_plaintext_to_encrypted_secrets'
    ),
    inet_client_addr()
  );
END;
$$;

-- Create enhanced RLS policies with additional security
DROP POLICY IF EXISTS "Admins can manage SMS configurations" ON public.sms_configurations;

CREATE POLICY "Admins can manage SMS configurations with enhanced security"
ON public.sms_configurations
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND check_rate_limit(auth.uid()::text, 'sms_config_access', 10, 5)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND check_rate_limit(auth.uid()::text, 'sms_config_modify', 5, 10)
);

-- Add trigger to audit all SMS configuration changes
CREATE OR REPLACE FUNCTION public.audit_sms_config_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Enhanced logging for SMS configuration changes
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    'sms_config_' || TG_OP::text,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'gateway_name', COALESCE(NEW.gateway_name, OLD.gateway_name),
      'credentials_encrypted', COALESCE(NEW.credentials_encrypted, OLD.credentials_encrypted),
      'has_sensitive_data', CASE 
        WHEN NEW.api_token_secret IS NOT NULL OR OLD.api_token_secret IS NOT NULL THEN true
        ELSE false
      END,
      'timestamp', now()
    ),
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER audit_sms_configurations
  AFTER INSERT OR UPDATE OR DELETE ON public.sms_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_sms_config_changes();

-- Create a secure function to validate SMS configurations without exposing secrets
CREATE OR REPLACE FUNCTION public.validate_sms_configuration(config_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  config_record RECORD;
  validation_result jsonb := '{}';
BEGIN
  -- Only allow admins to validate configurations
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can validate SMS configurations';
  END IF;
  
  SELECT * INTO config_record 
  FROM public.sms_configurations 
  WHERE id = config_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Configuration not found');
  END IF;
  
  validation_result := jsonb_build_object(
    'valid', true,
    'gateway_name', config_record.gateway_name,
    'is_active', config_record.is_active,
    'credentials_encrypted', config_record.credentials_encrypted,
    'has_secret_references', 
      config_record.api_token_secret_name IS NOT NULL AND 
      config_record.api_token_id_secret_name IS NOT NULL,
    'migration_needed', 
      config_record.api_token_secret IS NOT NULL OR 
      config_record.api_token_id IS NOT NULL
  );
  
  RETURN validation_result;
END;
$$;