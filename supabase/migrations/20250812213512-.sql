-- Ensure SMSAO is the default and ONSMS is not
UPDATE sender_ids SET is_default = false WHERE sender_id = 'ONSMS';

-- If SMSAO exists, set as default and approved
UPDATE sender_ids 
SET is_default = true, status = 'approved', bulksms_status = 'approved'
WHERE sender_id = 'SMSAO';

-- If no SMSAO exists for any user, create one for the main admin user as default
INSERT INTO sender_ids (user_id, sender_id, status, bulksms_status, is_default, supported_gateways)
SELECT '8a2544af-b71e-4e66-9068-fac3172bb791', 'SMSAO', 'approved', 'approved', true, ARRAY['bulksms']
WHERE NOT EXISTS (SELECT 1 FROM sender_ids WHERE sender_id = 'SMSAO');