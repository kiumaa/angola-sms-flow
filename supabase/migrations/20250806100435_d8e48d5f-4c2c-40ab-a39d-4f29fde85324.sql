-- Remove Routee gateway from sms_gateways table
DELETE FROM public.sms_gateways WHERE name = 'routee';

-- Drop routee_settings table completely
DROP TABLE IF EXISTS public.routee_settings;