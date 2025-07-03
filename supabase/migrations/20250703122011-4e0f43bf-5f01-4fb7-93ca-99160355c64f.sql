-- Add test credits to admin user
UPDATE public.profiles 
SET credits = 100
WHERE email = 'accounts@kbagency.me';