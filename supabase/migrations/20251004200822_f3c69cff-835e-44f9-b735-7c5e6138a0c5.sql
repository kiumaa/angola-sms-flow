-- Phase 2: Fix Profiles Table Service Role Overpermissiveness
-- Restricts service role to only update credits column

-- Step 1: Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Service role can update profile credits" ON public.profiles;

-- Step 2: Create a validation function that ensures only credits are updated
CREATE OR REPLACE FUNCTION public.validate_service_role_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service role to only update credits and updated_at
  IF current_setting('role') = 'service_role' THEN
    -- Ensure critical fields remain unchanged
    IF NEW.id <> OLD.id OR
       NEW.user_id <> OLD.user_id OR
       NEW.email IS DISTINCT FROM OLD.email OR
       NEW.full_name IS DISTINCT FROM OLD.full_name OR
       NEW.phone IS DISTINCT FROM OLD.phone OR
       NEW.company_name IS DISTINCT FROM OLD.company_name OR
       NEW.default_sender_id IS DISTINCT FROM OLD.default_sender_id OR
       NEW.email_confirm_token IS DISTINCT FROM OLD.email_confirm_token OR
       NEW.email_confirmed IS DISTINCT FROM OLD.email_confirmed OR
       NEW.email_confirm_expires_at IS DISTINCT FROM OLD.email_confirm_expires_at OR
       NEW.user_status IS DISTINCT FROM OLD.user_status OR
       NEW.created_at <> OLD.created_at THEN
      RAISE EXCEPTION 'Service role can only update credits and updated_at columns';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 3: Add trigger to validate service role updates
DROP TRIGGER IF EXISTS validate_service_role_profile_changes ON public.profiles;
CREATE TRIGGER validate_service_role_profile_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_service_role_profile_update();

-- Step 4: Create a simple policy for service role updates
CREATE POLICY "Service role can update credits only"
ON public.profiles
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);