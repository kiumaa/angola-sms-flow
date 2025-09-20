-- Enhanced Security Fixes for Critical Vulnerabilities
-- Addressing the security scan findings with stronger RLS policies and validation

-- 1. Enhanced contacts table security with stricter validation
DROP POLICY IF EXISTS "Users can view only their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can create own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON public.contacts;

CREATE POLICY "Users can view only their own contacts with enhanced validation" 
ON public.contacts 
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND account_id = get_current_account_id()
  AND validate_user_session()
);

CREATE POLICY "Users can create own contacts with strict validation" 
ON public.contacts 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND account_id = get_current_account_id()
  AND validate_user_session()
  AND enhanced_security_rate_limit('contact_creation', 50, 60)
);

CREATE POLICY "Users can update own contacts with validation" 
ON public.contacts 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND account_id = get_current_account_id()
  AND validate_user_session()
)
WITH CHECK (
  auth.uid() = user_id 
  AND account_id = get_current_account_id()
  AND validate_user_session()
);

CREATE POLICY "Users can delete own contacts with validation" 
ON public.contacts 
FOR DELETE 
USING (
  auth.uid() = user_id 
  AND account_id = get_current_account_id()
  AND validate_user_session()
);

-- 2. Enhanced profiles table security with multi-layer validation
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON public.profiles;

CREATE POLICY "Users can view own profile with session validation" 
ON public.profiles 
FOR SELECT 
USING (
  user_id = auth.uid() 
  AND validate_user_session()
  AND user_status = 'active'
);

CREATE POLICY "Users can update own profile with enhanced validation" 
ON public.profiles 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  AND validate_user_session()
  AND user_status = 'active'
  AND enhanced_security_rate_limit('profile_update', 10, 60)
)
WITH CHECK (
  user_id = auth.uid() 
  AND validate_user_session()
  AND user_status = 'active'
);

-- 3. Enhanced campaign security with stricter access controls
DROP POLICY IF EXISTS "Users can manage own campaign targets" ON public.campaign_targets;

CREATE POLICY "Users can manage own campaign targets with enhanced validation" 
ON public.campaign_targets 
FOR ALL 
USING (
  account_id = get_current_account_id()
  AND validate_user_session()
  AND EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.id = campaign_targets.campaign_id 
    AND c.account_id = get_current_account_id()
    AND c.created_by = auth.uid()
  )
);

-- 4. Enhanced SMS logs security
DROP POLICY IF EXISTS "Users can view own sms logs" ON public.sms_logs;

CREATE POLICY "Users can view own sms logs with validation" 
ON public.sms_logs 
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND validate_user_session()
);

-- 5. Fix OTP policies to allow legitimate system operations while maintaining security
DROP POLICY IF EXISTS "otp_no_select" ON public.otp_requests;
DROP POLICY IF EXISTS "otp_no_select_anon" ON public.otp_requests;
DROP POLICY IF EXISTS "otp_no_insert" ON public.otp_requests;
DROP POLICY IF EXISTS "otp_no_insert_anon" ON public.otp_requests;
DROP POLICY IF EXISTS "otp_no_update" ON public.otp_requests;
DROP POLICY IF EXISTS "otp_no_update_anon" ON public.otp_requests;

-- Allow system operations for OTP while blocking direct user access
CREATE POLICY "System can manage OTP requests for legitimate operations" 
ON public.otp_requests 
FOR ALL 
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

-- 6. Enhanced security monitoring function
CREATE OR REPLACE FUNCTION public.enhanced_data_access_validation()
RETURNS trigger AS $$
BEGIN
  -- Log potential security violations
  IF TG_TABLE_NAME IN ('contacts', 'profiles', 'transactions', 'campaign_targets', 'sms_logs') THEN
    -- Validate session for all sensitive data access
    IF NOT validate_user_session() AND current_setting('role') != 'service_role' THEN
      PERFORM log_security_event('invalid_session_data_access', auth.uid(), 
        jsonb_build_object(
          'table', TG_TABLE_NAME,
          'operation', TG_OP,
          'timestamp', now(),
          'blocked', true
        )
      );
      RAISE EXCEPTION 'Invalid session: Access denied to sensitive data';
    END IF;
    
    -- Rate limit sensitive operations
    IF TG_OP IN ('INSERT', 'UPDATE', 'DELETE') THEN
      IF NOT enhanced_security_rate_limit('sensitive_data_operation', 100, 60) THEN
        PERFORM log_security_event('rate_limit_sensitive_data', auth.uid(), 
          jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'blocked', true
          )
        );
        RAISE EXCEPTION 'Rate limit exceeded for sensitive data operations';
      END IF;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply enhanced validation trigger to sensitive tables
CREATE TRIGGER enhanced_security_validation_contacts
  BEFORE SELECT OR INSERT OR UPDATE OR DELETE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION enhanced_data_access_validation();

CREATE TRIGGER enhanced_security_validation_profiles
  BEFORE SELECT OR INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION enhanced_data_access_validation();

CREATE TRIGGER enhanced_security_validation_campaign_targets
  BEFORE SELECT OR INSERT OR UPDATE OR DELETE ON public.campaign_targets
  FOR EACH ROW EXECUTE FUNCTION enhanced_data_access_validation();

CREATE TRIGGER enhanced_security_validation_sms_logs
  BEFORE SELECT OR INSERT OR UPDATE OR DELETE ON public.sms_logs
  FOR EACH ROW EXECUTE FUNCTION enhanced_data_access_validation();

-- 7. Create security monitoring view for admins
CREATE OR REPLACE VIEW public.security_monitoring_summary AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  action,
  COUNT(*) as event_count,
  COUNT(DISTINCT admin_id) as unique_users,
  array_agg(DISTINCT details->>'table') FILTER (WHERE details->>'table' IS NOT NULL) as affected_tables
FROM admin_audit_logs 
WHERE created_at > now() - INTERVAL '24 hours'
  AND action LIKE '%security%'
GROUP BY DATE_TRUNC('hour', created_at), action
ORDER BY hour DESC;

-- Grant access to security monitoring view for admins only
GRANT SELECT ON public.security_monitoring_summary TO authenticated;

CREATE POLICY "Only admins can view security monitoring" 
ON public.security_monitoring_summary 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));