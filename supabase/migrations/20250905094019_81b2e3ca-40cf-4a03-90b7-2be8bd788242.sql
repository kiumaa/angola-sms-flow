-- Ativar o BulkSMS no sistema
UPDATE public.sms_gateways 
SET is_active = true 
WHERE name = 'bulksms';

-- Garantir que temos dados básicos para todos os gateways principais
INSERT INTO public.sms_gateways (name, display_name, api_endpoint, auth_type, is_active, is_primary)
VALUES 
('bulksms', 'BulkSMS', 'https://api.bulksms.com/v1/messages', 'basic_auth', true, false),
('bulkgate', 'BulkGate', 'https://portal.bulkgate.com/api/1.0/simple', 'api_key', true, true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  api_endpoint = EXCLUDED.api_endpoint,
  auth_type = EXCLUDED.auth_type,
  is_active = EXCLUDED.is_active,
  updated_at = now();