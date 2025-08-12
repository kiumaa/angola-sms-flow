-- Update existing SMSAO to not be default anymore
UPDATE sender_ids SET is_default = false WHERE sender_id = 'SMSAO';

-- Insert or update ONSMS as the default sender ID
INSERT INTO sender_ids (sender_id, status, is_default, supported_gateways, bulksms_status, user_id)
VALUES ('ONSMS', 'approved', true, ARRAY['bulksms'], 'approved', '8a2544af-b71e-4e66-9068-fac3172bb791')
ON CONFLICT (sender_id, user_id) 
DO UPDATE SET 
  status = 'approved',
  is_default = true,
  bulksms_status = 'approved',
  updated_at = now();