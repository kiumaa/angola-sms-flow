-- Insert default SMS gateways with proper configuration
INSERT INTO public.sms_gateways (name, display_name, api_endpoint, auth_type, is_active, is_primary) VALUES 
('routee', 'Routee SMS', 'https://connect.routee.net/sms', 'oauth2', true, true),
('bulksms', 'BulkSMS', 'https://api.bulksms.com/v1/messages', 'basic_auth', true, false),
('bulkgate', 'BulkGate', 'https://portal.bulkgate.com/api/1.0/simple', 'api_key', false, false),
('africastalking', 'Africa''s Talking', 'https://api.africastalking.com/version1/messaging', 'api_key', false, false)
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    api_endpoint = EXCLUDED.api_endpoint,
    auth_type = EXCLUDED.auth_type,
    updated_at = now();