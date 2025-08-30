-- Remove Africa's Talking gateway from database
DELETE FROM public.sms_gateways 
WHERE name = 'africastalking' OR display_name ILIKE '%africa%talking%';

-- Remove any sender IDs that only support africastalking
DELETE FROM public.sender_ids 
WHERE supported_gateways = ARRAY['africastalking'] 
OR (array_length(supported_gateways, 1) = 1 AND 'africastalking' = ANY(supported_gateways));

-- Update sender IDs to remove africastalking from supported gateways
UPDATE public.sender_ids 
SET supported_gateways = array_remove(supported_gateways, 'africastalking')
WHERE 'africastalking' = ANY(supported_gateways);

-- Clean up SMS logs that might reference africastalking
UPDATE public.sms_logs 
SET gateway_used = 'bulksms', original_gateway = 'bulksms'
WHERE gateway_used = 'africastalking' OR original_gateway = 'africastalking';