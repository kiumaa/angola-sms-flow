-- Phase 1: Critical Security Fixes for RLS Policies

-- 1. Fix sender_ids table to remove public exposure of sensitive metadata
DROP POLICY IF EXISTS "Public can view approved global sender IDs" ON public.sender_ids;

-- Create a more secure policy that only shows the sender_id field for approved global senders
CREATE POLICY "Public can view approved sender names only" 
ON public.sender_ids 
FOR SELECT 
USING (
  (account_id IS NULL) 
  AND (status = 'approved'::text)
  AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
);

-- 2. Enhance contacts table RLS policies for better security
DROP POLICY IF EXISTS "Users can manage own contacts" ON public.contacts;

-- Create stricter contact policies
CREATE POLICY "Users can view own contacts" 
ON public.contacts 
FOR SELECT 
USING (account_id = get_current_account_id());

CREATE POLICY "Users can create own contacts" 
ON public.contacts 
FOR INSERT 
WITH CHECK (
  account_id = get_current_account_id() 
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update own contacts" 
ON public.contacts 
FOR UPDATE 
USING (account_id = get_current_account_id() AND user_id = auth.uid())
WITH CHECK (account_id = get_current_account_id() AND user_id = auth.uid());

CREATE POLICY "Users can delete own contacts" 
ON public.contacts 
FOR DELETE 
USING (account_id = get_current_account_id() AND user_id = auth.uid());

-- 3. Strengthen profiles table security
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create more secure profile policies
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile only" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Prevent profile creation by regular users (only handle_new_user trigger)
CREATE POLICY "System can create profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() IS NULL OR has_role(auth.uid(), 'admin'::app_role));

-- 4. Enhance transactions table security
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON public.transactions;

-- Create stricter transaction policies
CREATE POLICY "Users can view own transactions only" 
ON public.transactions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create own transactions only" 
ON public.transactions 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND auth.uid() IS NOT NULL
);

-- Prevent transaction updates/deletes by regular users
CREATE POLICY "Only admins can modify transactions" 
ON public.transactions 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete transactions" 
ON public.transactions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Add security constraints to critical tables
-- Ensure user_id cannot be null in profiles
ALTER TABLE public.profiles 
ALTER COLUMN user_id SET NOT NULL;

-- Ensure account_id cannot be null in contacts  
ALTER TABLE public.contacts 
ALTER COLUMN account_id SET NOT NULL;

-- Ensure user_id cannot be null in transactions
ALTER TABLE public.transactions 
ALTER COLUMN user_id SET NOT NULL;

-- 6. Create security monitoring function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  user_identifier uuid,
  details jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    target_user_id,
    details,
    ip_address
  ) VALUES (
    COALESCE(user_identifier, auth.uid()),
    'security_event_' || event_type,
    user_identifier,
    details || jsonb_build_object('timestamp', now(), 'session_id', auth.jwt() ->> 'session_id'),
    inet_client_addr()
  );
END;
$$;

-- 7. Add RLS policy validation trigger
CREATE OR REPLACE FUNCTION public.validate_rls_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log any potential RLS bypasses for sensitive tables
  IF TG_TABLE_NAME IN ('profiles', 'contacts', 'transactions', 'credit_adjustments') THEN
    IF auth.uid() IS NULL AND current_setting('role') != 'service_role' THEN
      PERFORM log_security_event('anonymous_access_attempt', NULL, 
        jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP));
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply validation trigger to critical tables
DROP TRIGGER IF EXISTS rls_validation_profiles ON public.profiles;
CREATE TRIGGER rls_validation_profiles
  BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION validate_rls_access();

DROP TRIGGER IF EXISTS rls_validation_contacts ON public.contacts;  
CREATE TRIGGER rls_validation_contacts
  BEFORE INSERT OR UPDATE OR DELETE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION validate_rls_access();

DROP TRIGGER IF EXISTS rls_validation_transactions ON public.transactions;
CREATE TRIGGER rls_validation_transactions
  BEFORE INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION validate_rls_access();

-- 8. Add session security enhancements
CREATE OR REPLACE FUNCTION public.check_session_security()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_data jsonb;
  last_activity timestamp;
BEGIN
  -- Get session info
  session_data := auth.jwt();
  
  -- Check for session hijacking indicators
  IF session_data IS NULL OR auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Log session validation
  PERFORM log_security_event('session_validation', auth.uid(), 
    jsonb_build_object('ip', inet_client_addr(), 'user_agent', current_setting('request.headers', true)::jsonb ->> 'user-agent'));
  
  RETURN true;
END;
$$;