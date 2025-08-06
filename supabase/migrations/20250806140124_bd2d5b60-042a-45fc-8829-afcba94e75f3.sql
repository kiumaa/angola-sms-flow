-- Remove BulkGate related columns from sender_ids table
ALTER TABLE public.sender_ids DROP COLUMN IF EXISTS bulkgate_status;

-- Update supported_gateways array to remove 'bulkgate' entries
UPDATE public.sender_ids 
SET supported_gateways = array_remove(supported_gateways, 'bulkgate')
WHERE 'bulkgate' = ANY(supported_gateways);

-- Remove any SMS logs that used bulkgate gateway
DELETE FROM public.sms_logs WHERE gateway_used = 'bulkgate';

-- Remove any SMS configurations for bulkgate
DELETE FROM public.sms_configurations WHERE gateway_name = 'bulkgate';