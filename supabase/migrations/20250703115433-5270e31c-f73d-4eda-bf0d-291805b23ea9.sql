-- Add admin role for accounts@kbagency.me
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role 
FROM public.profiles 
WHERE email = 'accounts@kbagency.me'
ON CONFLICT (user_id, role) DO NOTHING;