-- Phase 2: Enhanced Security - Fixed
-- Drop existing policies and recreate properly

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view own MFA settings" ON public.admin_mfa_settings;
DROP POLICY IF EXISTS "Admins can update own MFA settings" ON public.admin_mfa_settings;
DROP POLICY IF EXISTS "System can create MFA settings" ON public.admin_mfa_settings;
DROP POLICY IF EXISTS "Only admins can view MFA bypass logs" ON public.admin_mfa_bypass_logs;
DROP POLICY IF EXISTS "Only admins can manage retention policies" ON public.data_retention_policies;

-- Drop tables if they exist
DROP TABLE IF EXISTS public.data_retention_policies CASCADE;
DROP TABLE IF EXISTS public.admin_mfa_bypass_logs CASCADE;
DROP TABLE IF EXISTS public.admin_mfa_settings CASCADE;

-- ============================================
-- PART 1: MFA Tracking and Enforcement
-- ============================================

-- Table to track MFA status for admin users
CREATE TABLE public.admin_mfa_settings (
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

ALTER TABLE public.admin_mfa_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own MFA settings"
ON public.admin_mfa_settings
FOR SELECT
USING (auth.uid() = user_id AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update own MFA settings"
ON public.admin_mfa_settings
FOR UPDATE
USING (auth.uid() = user_id AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (auth.uid() = user_id AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create MFA settings"
ON public.admin_mfa_settings
FOR INSERT
WITH CHECK (current_setting('role') = 'service_role' OR auth.uid() = user_id);

-- Log MFA bypass attempts
CREATE TABLE public.admin_mfa_bypass_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  attempted_action text NOT NULL,
  bypass_reason text,
  ip_address inet,
  user_agent text,
  blocked boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_mfa_bypass_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view MFA bypass logs"
ON public.admin_mfa_bypass_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- PART 2: Data Retention Policies
-- ============================================

CREATE TABLE public.data_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL UNIQUE,
  retention_days integer NOT NULL,
  status_filter text[],
  date_column text NOT NULL DEFAULT 'created_at',
  is_active boolean NOT NULL DEFAULT true,
  last_cleanup_at timestamp with time zone,
  records_cleaned_last_run integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  description text
);

ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

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
  ('contact_import_jobs', 30, ARRAY['completed', 'failed'], 'created_at', 'Import jobs cleaned after 30 days');

-- Triggers
CREATE TRIGGER update_admin_mfa_settings_updated_at
BEFORE UPDATE ON public.admin_mfa_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at
BEFORE UPDATE ON public.data_retention_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.admin_mfa_settings IS 'Tracks MFA enrollment status for admin users';
COMMENT ON TABLE public.admin_mfa_bypass_logs IS 'Logs all attempts to bypass MFA requirements';
COMMENT ON TABLE public.data_retention_policies IS 'Defines data retention policies for automated cleanup';