-- Phase 2: Enhanced Security
-- 1. MFA tracking for admin accounts
-- 2. Data retention policies
-- 3. User data export functionality (LGPD)

-- ============================================
-- PART 1: MFA Tracking and Enforcement
-- ============================================

-- Table to track MFA status for admin users
CREATE TABLE IF NOT EXISTS public.admin_mfa_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_enabled boolean NOT NULL DEFAULT false,
  mfa_method text CHECK (mfa_method IN ('totp', 'sms', 'email')),
  enrolled_at timestamp with time zone,
  last_verified_at timestamp with time zone,
  backup_codes_generated boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_mfa_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view their own MFA settings
CREATE POLICY "Admins can view own MFA settings"
ON public.admin_mfa_settings
FOR SELECT
USING (auth.uid() = user_id AND has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update their own MFA settings
CREATE POLICY "Admins can update own MFA settings"
ON public.admin_mfa_settings
FOR UPDATE
USING (auth.uid() = user_id AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'admin'::app_role));

-- System can create MFA settings
CREATE POLICY "System can create MFA settings"
ON public.admin_mfa_settings
FOR INSERT
WITH CHECK (current_setting('role') = 'service_role' OR auth.uid() = user_id);

-- Log MFA bypass attempts
CREATE TABLE IF NOT EXISTS public.admin_mfa_bypass_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  attempted_action text NOT NULL,
  bypass_reason text,
  ip_address inet,
  user_agent text,
  blocked boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_mfa_bypass_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view MFA bypass logs
CREATE POLICY "Only admins can view MFA bypass logs"
ON public.admin_mfa_bypass_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to check if admin has MFA enabled
CREATE OR REPLACE FUNCTION public.admin_has_mfa_enabled(admin_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT mfa_enabled FROM public.admin_mfa_settings WHERE user_id = admin_user_id),
    false
  );
$$;

-- Function to log MFA bypass attempts
CREATE OR REPLACE FUNCTION public.log_mfa_bypass_attempt(
  attempted_action_param text,
  bypass_reason_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_mfa_bypass_logs (
    user_id,
    attempted_action,
    bypass_reason,
    ip_address,
    blocked
  ) VALUES (
    auth.uid(),
    attempted_action_param,
    bypass_reason_param,
    inet_client_addr(),
    true
  );
  
  -- Also log to admin audit logs
  PERFORM log_security_event('mfa_bypass_attempt', auth.uid(), 
    jsonb_build_object(
      'action', attempted_action_param,
      'reason', bypass_reason_param,
      'mfa_enabled', admin_has_mfa_enabled(auth.uid())
    )
  );
END;
$$;

-- ============================================
-- PART 2: Data Retention Policies Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL UNIQUE,
  retention_days integer NOT NULL,
  status_filter text[], -- Array of status values to clean (e.g., ['completed', 'failed'])
  date_column text NOT NULL DEFAULT 'created_at',
  is_active boolean NOT NULL DEFAULT true,
  last_cleanup_at timestamp with time zone,
  records_cleaned_last_run integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  description text
);

-- Enable RLS
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

-- Only admins can manage retention policies
CREATE POLICY "Only admins can manage retention policies"
ON public.data_retention_policies
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default retention policies
INSERT INTO public.data_retention_policies (table_name, retention_days, status_filter, date_column, description)
VALUES 
  ('otp_requests', 1, NULL, 'created_at', 'OTP codes expire after 5 minutes, cleanup after 1 day'),
  ('sms_logs', 180, NULL, 'created_at', 'SMS logs retained for 6 months'),
  ('campaign_targets', 90, ARRAY['delivered', 'failed', 'undeliverable'], 'delivered_at', 'Completed campaign targets kept for 90 days'),
  ('campaigns', 30, ARRAY['draft'], 'created_at', 'Draft campaigns deleted after 30 days'),
  ('lgpd_requests', 365, ARRAY['completed', 'rejected'], 'created_at', 'Processed LGPD requests kept for 1 year'),
  ('admin_audit_logs', 730, NULL, 'created_at', 'Audit logs retained for 2 years'),
  ('contact_import_jobs', 30, ARRAY['completed', 'failed'], 'created_at', 'Import jobs cleaned after 30 days')
ON CONFLICT (table_name) DO NOTHING;

-- ============================================
-- PART 3: User Data Export (LGPD Compliance)
-- ============================================

-- Function to export all user data (LGPD Article 18)
CREATE OR REPLACE FUNCTION public.export_user_data(export_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_data jsonb := '{}'::jsonb;
  profile_data jsonb;
  contacts_data jsonb;
  campaigns_data jsonb;
  sms_logs_data jsonb;
  transactions_data jsonb;
  lgpd_requests_data jsonb;
BEGIN
  -- Only allow users to export their own data or admins
  IF export_user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Can only export your own data';
  END IF;
  
  -- Log the export request
  PERFORM log_security_event('user_data_export', export_user_id, 
    jsonb_build_object(
      'requested_by', auth.uid(),
      'timestamp', now()
    )
  );
  
  -- Get profile data
  SELECT to_jsonb(p.*) INTO profile_data
  FROM public.profiles p
  WHERE p.user_id = export_user_id;
  
  -- Get contacts
  SELECT jsonb_agg(to_jsonb(c.*)) INTO contacts_data
  FROM public.contacts c
  WHERE c.user_id = export_user_id;
  
  -- Get campaigns
  SELECT jsonb_agg(to_jsonb(camp.*)) INTO campaigns_data
  FROM public.campaigns camp
  WHERE camp.created_by = export_user_id;
  
  -- Get SMS logs (last 6 months only)
  SELECT jsonb_agg(to_jsonb(s.*)) INTO sms_logs_data
  FROM public.sms_logs s
  WHERE s.user_id = export_user_id
    AND s.created_at > now() - interval '6 months';
  
  -- Get transactions
  SELECT jsonb_agg(to_jsonb(t.*)) INTO transactions_data
  FROM public.transactions t
  WHERE t.user_id = export_user_id;
  
  -- Get LGPD requests
  SELECT jsonb_agg(to_jsonb(l.*)) INTO lgpd_requests_data
  FROM public.lgpd_requests l
  WHERE l.user_id = export_user_id;
  
  -- Build the complete export
  user_data := jsonb_build_object(
    'export_date', now(),
    'user_id', export_user_id,
    'profile', profile_data,
    'contacts', COALESCE(contacts_data, '[]'::jsonb),
    'campaigns', COALESCE(campaigns_data, '[]'::jsonb),
    'sms_logs', COALESCE(sms_logs_data, '[]'::jsonb),
    'transactions', COALESCE(transactions_data, '[]'::jsonb),
    'lgpd_requests', COALESCE(lgpd_requests_data, '[]'::jsonb),
    'data_retention_notice', 'This export contains your data as of the export date. Some historical data may have been purged according to our data retention policies.'
  );
  
  RETURN user_data;
END;
$$;

-- Function to request complete data deletion (LGPD Article 18)
CREATE OR REPLACE FUNCTION public.request_data_deletion(deletion_reason text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_id uuid;
BEGIN
  -- Create LGPD request for deletion
  INSERT INTO public.lgpd_requests (
    user_id,
    user_email,
    request_type,
    reason,
    status
  ) VALUES (
    auth.uid(),
    (SELECT email FROM public.profiles WHERE user_id = auth.uid()),
    'deletion',
    COALESCE(deletion_reason, 'User requested complete data deletion'),
    'pending'
  ) RETURNING id INTO request_id;
  
  -- Log the deletion request
  PERFORM log_security_event('data_deletion_requested', auth.uid(), 
    jsonb_build_object(
      'request_id', request_id,
      'reason', deletion_reason
    )
  );
  
  RETURN request_id;
END;
$$;

-- ============================================
-- PART 4: Automatic Trigger for Admin MFA
-- ============================================

-- Trigger to auto-create MFA settings when user becomes admin
CREATE OR REPLACE FUNCTION public.create_admin_mfa_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role = 'admin'::app_role THEN
    INSERT INTO public.admin_mfa_settings (user_id, mfa_enabled)
    VALUES (NEW.user_id, false)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Log that admin should enable MFA
    PERFORM log_security_event('admin_role_granted_mfa_required', NEW.user_id, 
      jsonb_build_object(
        'granted_by', auth.uid(),
        'mfa_required', true,
        'mfa_enabled', false
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_admin_mfa_settings
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.create_admin_mfa_settings();

-- Update trigger for updated_at
CREATE TRIGGER update_admin_mfa_settings_updated_at
BEFORE UPDATE ON public.admin_mfa_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at
BEFORE UPDATE ON public.data_retention_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.admin_has_mfa_enabled(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_mfa_bypass_attempt(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.export_user_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_data_deletion(text) TO authenticated;

-- Comments
COMMENT ON TABLE public.admin_mfa_settings IS 'Tracks MFA enrollment status for admin users';
COMMENT ON TABLE public.admin_mfa_bypass_logs IS 'Logs all attempts to bypass MFA requirements';
COMMENT ON TABLE public.data_retention_policies IS 'Defines data retention policies for automated cleanup';
COMMENT ON FUNCTION public.admin_has_mfa_enabled(uuid) IS 'Checks if an admin has MFA enabled';
COMMENT ON FUNCTION public.log_mfa_bypass_attempt(text, text) IS 'Logs MFA bypass attempts for security monitoring';
COMMENT ON FUNCTION public.export_user_data(uuid) IS 'Exports all user data for LGPD compliance (Article 18)';
COMMENT ON FUNCTION public.request_data_deletion(text) IS 'Requests complete data deletion for LGPD compliance (Article 18)';