-- Configure BulkGate gateway in sms_configurations table
INSERT INTO public.sms_configurations (
  gateway_name,
  api_token_id_secret_name,
  api_token_secret_name,
  credentials_encrypted,
  is_active
) VALUES (
  'bulkgate',
  'BULKGATE_API_KEY',
  'BULKGATE_API_KEY',
  true,
  true
) ON CONFLICT (gateway_name) DO UPDATE SET
  api_token_id_secret_name = 'BULKGATE_API_KEY',
  api_token_secret_name = 'BULKGATE_API_KEY',
  credentials_encrypted = true,
  is_active = true,
  updated_at = now();