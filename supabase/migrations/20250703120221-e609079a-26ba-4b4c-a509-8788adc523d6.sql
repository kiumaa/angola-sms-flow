-- Update the user to have admin role
UPDATE public.user_roles 
SET role = 'admin'::app_role 
WHERE user_id = (
  SELECT user_id 
  FROM public.profiles 
  WHERE email = 'accounts@kbagency.me'
);