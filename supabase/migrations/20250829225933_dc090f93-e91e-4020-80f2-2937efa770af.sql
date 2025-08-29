-- Update RLS policy to allow public access to active credit packages
DROP POLICY IF EXISTS "Authenticated users can view packages" ON public.credit_packages;

-- Create new policy that allows public access to active packages
CREATE POLICY "Public can view active packages" 
ON public.credit_packages 
FOR SELECT 
USING (is_active = true);

-- Keep admin policy unchanged
-- (The "Admins can manage packages" policy already exists and covers all operations for admins)