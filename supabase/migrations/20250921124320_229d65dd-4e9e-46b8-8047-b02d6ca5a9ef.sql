-- Fix search_path security warnings in database functions
-- This addresses the critical security warnings from the linter

CREATE OR REPLACE FUNCTION public.get_default_sender_id(account_user_id uuid DEFAULT NULL::uuid)
RETURNS TEXT AS $$
DECLARE
  default_sender TEXT := 'SMSAO';
BEGIN
  -- Sempre retorna SMSAO como padrão por enquanto
  -- No futuro pode ser estendido para multi-tenant
  RETURN default_sender;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.get_active_gateway_override()
RETURNS text AS $$
DECLARE
  active_override TEXT;
BEGIN
  SELECT override_type INTO active_override
  FROM public.gateway_overrides
  WHERE is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
  
  RETURN COALESCE(active_override, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.get_effective_sender_id(_user_id uuid, _requested_sender_id text DEFAULT NULL::text)
RETURNS text AS $$
DECLARE
  user_default_sender TEXT;
  approved_sender TEXT;
  effective_sender TEXT := 'SMSAO';
BEGIN
  -- Buscar sender ID padrão do usuário
  SELECT default_sender_id INTO user_default_sender
  FROM public.profiles
  WHERE user_id = _user_id;
  
  -- Se foi solicitado um sender específico, verificar se está aprovado
  IF _requested_sender_id IS NOT NULL THEN
    SELECT sender_id INTO approved_sender
    FROM public.sender_ids
    WHERE user_id = _user_id 
      AND sender_id = _requested_sender_id
      AND status = 'approved'
      AND account_id IS NOT NULL
    LIMIT 1;
    
    IF approved_sender IS NOT NULL THEN
      effective_sender := approved_sender;
    END IF;
  ELSE
    -- Buscar sender ID padrão aprovado do usuário
    SELECT sender_id INTO approved_sender
    FROM public.sender_ids
    WHERE user_id = _user_id 
      AND is_default = true
      AND status = 'approved'
      AND account_id IS NOT NULL
    LIMIT 1;
    
    IF approved_sender IS NOT NULL THEN
      effective_sender := approved_sender;
    ELSIF user_default_sender IS NOT NULL AND user_default_sender != 'SMSao' THEN
      -- Verificar se o padrão do perfil está aprovado
      SELECT sender_id INTO approved_sender
      FROM public.sender_ids
      WHERE user_id = _user_id 
        AND sender_id = user_default_sender
        AND status = 'approved'
        AND account_id IS NOT NULL
      LIMIT 1;
      
      IF approved_sender IS NOT NULL THEN
        effective_sender := approved_sender;
      END IF;
    END IF;
  END IF;
  
  RETURN effective_sender;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

CREATE OR REPLACE FUNCTION public.get_current_account_id()
RETURNS uuid AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public';

-- Fix credit_packages RLS policy to require authentication
DROP POLICY IF EXISTS "Public can view active packages" ON public.credit_packages;

CREATE POLICY "Authenticated users can view active packages" 
ON public.credit_packages FOR SELECT 
USING (is_active = true AND auth.role() = 'authenticated');

-- Add comprehensive data cleanup and system health functions
CREATE OR REPLACE FUNCTION public.production_system_health_check()
RETURNS jsonb AS $$
DECLARE
  result jsonb := '{}';
  total_users integer;
  active_sms_configs integer;
  pending_credit_requests integer;
  failed_sms_last_24h integer;
  orphaned_data integer;
BEGIN
  -- Verificar usuários ativos
  SELECT COUNT(*) INTO total_users
  FROM public.profiles 
  WHERE user_status = 'active';
  
  -- Verificar configurações SMS ativas
  SELECT COUNT(*) INTO active_sms_configs
  FROM public.sms_configurations 
  WHERE is_active = true;
  
  -- Verificar pedidos de crédito pendentes
  SELECT COUNT(*) INTO pending_credit_requests
  FROM public.credit_requests 
  WHERE status = 'pending';
  
  -- Verificar SMS falhados nas últimas 24h
  SELECT COUNT(*) INTO failed_sms_last_24h
  FROM public.sms_logs 
  WHERE status = 'failed' 
    AND created_at > now() - interval '24 hours';
  
  -- Verificar dados órfãos
  SELECT COUNT(*) INTO orphaned_data
  FROM public.contacts c
  LEFT JOIN public.profiles p ON c.account_id = p.id
  WHERE p.id IS NULL;
  
  result := jsonb_build_object(
    'timestamp', now(),
    'system_status', CASE 
      WHEN failed_sms_last_24h > 100 OR orphaned_data > 50 THEN 'warning'
      WHEN active_sms_configs = 0 THEN 'critical'
      ELSE 'healthy'
    END,
    'metrics', jsonb_build_object(
      'total_users', total_users,
      'active_sms_configs', active_sms_configs,
      'pending_credit_requests', pending_credit_requests,
      'failed_sms_24h', failed_sms_last_24h,
      'orphaned_data', orphaned_data
    ),
    'recommendations', CASE 
      WHEN orphaned_data > 0 THEN jsonb_build_array('cleanup_orphaned_data')
      WHEN pending_credit_requests > 10 THEN jsonb_build_array('review_credit_requests')
      ELSE jsonb_build_array('system_healthy')
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Enhanced data cleanup for production
CREATE OR REPLACE FUNCTION public.production_data_cleanup()
RETURNS integer AS $$
DECLARE
  cleaned_count integer := 0;
  temp_count integer;
BEGIN
  -- Limpar OTPs muito antigos (mais de 2 horas)
  DELETE FROM public.otp_requests 
  WHERE created_at < now() - interval '2 hours';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  cleaned_count := cleaned_count + temp_count;
  
  -- Limpar logs de audit muito antigos (mais de 2 anos)
  DELETE FROM public.admin_audit_logs 
  WHERE created_at < now() - interval '2 years';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  cleaned_count := cleaned_count + temp_count;
  
  -- Limpar contact import jobs concluídos há mais de 30 dias
  DELETE FROM public.contact_import_jobs 
  WHERE status IN ('completed', 'failed') 
    AND created_at < now() - interval '30 days';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  cleaned_count := cleaned_count + temp_count;
  
  -- Log da limpeza
  INSERT INTO public.admin_audit_logs (
    admin_id,
    action,
    details,
    ip_address
  ) VALUES (
    (SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LIMIT 1),
    'production_cleanup_completed',
    jsonb_build_object(
      'records_cleaned', cleaned_count,
      'timestamp', now(),
      'cleanup_type', 'automated_production'
    ),
    inet_client_addr()
  );
  
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';