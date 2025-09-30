-- Security Hardening: Fix function search path vulnerabilities
-- Update all database functions to include proper search_path setting

-- Fix all existing functions to include SET search_path = public
CREATE OR REPLACE FUNCTION public.get_default_sender_id(account_user_id uuid DEFAULT NULL::uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  default_sender TEXT := 'SMSAO';
BEGIN
  -- Sempre retorna SMSAO como padrão por enquanto
  -- No futuro pode ser estendido para multi-tenant
  RETURN default_sender;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_rls_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_sms_logs_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now(); 
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.count_contacts_in_list(list_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.contact_list_members
  WHERE list_id = $1;
$function$;

CREATE OR REPLACE FUNCTION public.check_session_security()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
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
$function$;

-- Create enhanced security monitoring function
CREATE OR REPLACE FUNCTION public.enhanced_security_monitoring()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  current_user_id uuid := auth.uid();
  current_ip inet := inet_client_addr();
  suspicious_patterns text[];
BEGIN
  -- Enhanced security pattern detection
  suspicious_patterns := ARRAY[]::text[];
  
  -- Check for rapid consecutive admin operations
  IF TG_TABLE_NAME IN ('user_roles', 'credit_adjustments', 'smtp_settings') THEN
    -- Check for excessive operations in short time window
    IF NOT enhanced_security_rate_limit('critical_operations', 5, 2) THEN
      suspicious_patterns := array_append(suspicious_patterns, 'rapid_critical_operations');
    END IF;
  END IF;
  
  -- Check for unusual IP patterns
  IF current_ip IS NOT NULL THEN
    -- Check if admin is using multiple IPs in short time
    PERFORM 1 FROM admin_audit_logs 
    WHERE admin_id = current_user_id 
      AND ip_address != current_ip 
      AND created_at > now() - interval '30 minutes'
    LIMIT 1;
    
    IF FOUND THEN
      suspicious_patterns := array_append(suspicious_patterns, 'multiple_ip_addresses');
    END IF;
  END IF;
  
  -- Check for after-hours operations (outside 6 AM - 10 PM Angola time)
  IF EXTRACT(hour FROM now() AT TIME ZONE 'Africa/Luanda') NOT BETWEEN 6 AND 22 THEN
    suspicious_patterns := array_append(suspicious_patterns, 'after_hours_operation');
  END IF;
  
  -- Log enhanced security events
  IF array_length(suspicious_patterns, 1) > 0 THEN
    PERFORM log_security_event('enhanced_security_alert', current_user_id, 
      jsonb_build_object(
        'patterns', suspicious_patterns,
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'ip_address', current_ip,
        'timestamp', now(),
        'risk_score', array_length(suspicious_patterns, 1) * 2
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create security configuration validation function
CREATE OR REPLACE FUNCTION public.validate_security_configuration()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  result jsonb := '{}';
  rls_enabled_count integer;
  total_tables integer;
  unprotected_tables text[];
  critical_functions_count integer;
BEGIN
  -- Check RLS coverage
  SELECT COUNT(*) INTO total_tables
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND rowsecurity = true;
  
  -- Find unprotected tables
  SELECT array_agg(tablename) INTO unprotected_tables
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND rowsecurity = false;
  
  -- Check critical security functions
  SELECT COUNT(*) INTO critical_functions_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('has_role', 'validate_user_session', 'log_security_event');
  
  result := jsonb_build_object(
    'rls_coverage', jsonb_build_object(
      'enabled_tables', rls_enabled_count,
      'total_tables', total_tables,
      'coverage_percentage', round((rls_enabled_count::numeric / total_tables * 100), 2),
      'unprotected_tables', COALESCE(unprotected_tables, ARRAY[]::text[])
    ),
    'security_functions', jsonb_build_object(
      'critical_functions_available', critical_functions_count,
      'expected_functions', 3,
      'all_present', critical_functions_count >= 3
    ),
    'audit_logging', jsonb_build_object(
      'enabled', EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'admin_audit_logs' AND schemaname = 'public'),
      'recent_entries', (SELECT COUNT(*) FROM admin_audit_logs WHERE created_at > now() - interval '24 hours')
    ),
    'security_score', CASE 
      WHEN rls_enabled_count::numeric / total_tables >= 0.9 AND critical_functions_count >= 3 THEN 95
      WHEN rls_enabled_count::numeric / total_tables >= 0.8 AND critical_functions_count >= 2 THEN 85
      WHEN rls_enabled_count::numeric / total_tables >= 0.7 THEN 75
      ELSE 60
    END,
    'timestamp', now()
  );
  
  -- Log security configuration check
  PERFORM log_security_event('security_configuration_audit', auth.uid(), result);
  
  RETURN result;
END;
$function$;

-- Add enhanced security monitoring triggers to critical tables
DROP TRIGGER IF EXISTS enhanced_security_monitor_user_roles ON public.user_roles;
CREATE TRIGGER enhanced_security_monitor_user_roles
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION enhanced_security_monitoring();

DROP TRIGGER IF EXISTS enhanced_security_monitor_credit_adjustments ON public.credit_adjustments;
CREATE TRIGGER enhanced_security_monitor_credit_adjustments
  BEFORE INSERT OR UPDATE OR DELETE ON public.credit_adjustments
  FOR EACH ROW EXECUTE FUNCTION enhanced_security_monitoring();

DROP TRIGGER IF EXISTS enhanced_security_monitor_smtp_settings ON public.smtp_settings;
CREATE TRIGGER enhanced_security_monitor_smtp_settings
  BEFORE INSERT OR UPDATE OR DELETE ON public.smtp_settings
  FOR EACH ROW EXECUTE FUNCTION enhanced_security_monitoring();

-- Add enhanced session security validation
CREATE OR REPLACE FUNCTION public.validate_enhanced_session()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  user_profile RECORD;
  session_risk_score integer := 0;
  recent_suspicious_activity integer;
BEGIN
  -- Basic session validation
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get user profile with enhanced checks
  SELECT * INTO user_profile
  FROM public.profiles
  WHERE user_id = auth.uid() AND user_status = 'active';
  
  IF NOT FOUND THEN
    PERFORM log_security_event('invalid_user_session', auth.uid(), 
      jsonb_build_object('reason', 'user_profile_not_found_or_inactive'));
    RETURN false;
  END IF;
  
  -- Check for recent suspicious activity
  SELECT COUNT(*) INTO recent_suspicious_activity
  FROM admin_audit_logs
  WHERE admin_id = auth.uid()
    AND action LIKE '%security_alert%'
    AND created_at > now() - interval '1 hour';
  
  -- Calculate session risk score
  IF recent_suspicious_activity > 0 THEN
    session_risk_score := session_risk_score + (recent_suspicious_activity * 10);
  END IF;
  
  -- Check for multiple IP usage
  IF EXISTS (
    SELECT 1 FROM admin_audit_logs 
    WHERE admin_id = auth.uid() 
      AND ip_address != inet_client_addr() 
      AND created_at > now() - interval '1 hour'
  ) THEN
    session_risk_score := session_risk_score + 20;
  END IF;
  
  -- Log high-risk sessions
  IF session_risk_score >= 30 THEN
    PERFORM log_security_event('high_risk_session_detected', auth.uid(), 
      jsonb_build_object(
        'risk_score', session_risk_score,
        'suspicious_activity_count', recent_suspicious_activity,
        'timestamp', now()
      ));
  END IF;
  
  -- Allow session but log if risky
  RETURN true;
END;
$function$;