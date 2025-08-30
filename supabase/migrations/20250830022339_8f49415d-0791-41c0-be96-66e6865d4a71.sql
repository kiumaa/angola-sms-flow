-- Fix security issues identified by the linter

-- Fix 1: Update functions to have proper search_path settings
-- The migrate_sms_credentials_to_secrets function already has search_path set correctly

-- Fix 2: Update the validate_sms_configuration function with explicit search_path
DROP FUNCTION IF EXISTS public.validate_sms_configuration(uuid);

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
  FROM sms_configurations 
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

-- Run the migration function to update existing configurations
SELECT migrate_sms_credentials_to_secrets();

-- Now we can safely remove the plaintext credential columns after migration
-- This is commented out for safety - should be done after confirming the migration worked
-- ALTER TABLE public.sms_configurations DROP COLUMN IF EXISTS api_token_id;
-- ALTER TABLE public.sms_configurations DROP COLUMN IF EXISTS api_token_secret;