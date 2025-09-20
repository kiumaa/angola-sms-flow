-- Allow public (anon) to view active credit packages on landing page
-- This keeps data read-only and restricted to active rows only
CREATE POLICY IF NOT EXISTS "Public can view active packages"
ON public.credit_packages
FOR SELECT
TO anon
USING (is_active = true);

-- Keep existing authenticated policy intact; no wider permissions added
