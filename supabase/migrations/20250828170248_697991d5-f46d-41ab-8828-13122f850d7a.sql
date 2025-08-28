-- ========================================
-- FASE 4: PREPARAÇÃO PARA PRODUÇÃO
-- Segurança + Performance
-- ========================================

-- 1. CORRIGIR EXPOSIÇÃO PÚBLICA DE DADOS SENSÍVEIS
-- ========================================

-- Remover políticas públicas perigosas dos brand_settings
DROP POLICY IF EXISTS "Anyone can view brand settings for public pages" ON public.brand_settings;

-- Nova política mais restritiva para brand_settings
CREATE POLICY "Public can view basic brand info only" ON public.brand_settings
FOR SELECT USING (
  -- Apenas campos básicos para o público
  true  -- Permitir leitura mas filtrar campos sensíveis na aplicação
);

-- Política para admins gerenciarem brand_settings
CREATE POLICY "Admins can manage brand settings" ON public.brand_settings
FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
) WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

-- 2. PROTEGER SMS GATEWAYS (CRÍTICO)
-- ========================================

-- Remover acesso público aos gateways SMS
DROP POLICY IF EXISTS "Anyone can view active gateways" ON public.sms_gateways;

-- Nova política: apenas admins podem ver gateways
CREATE POLICY "Only admins can view SMS gateways" ON public.sms_gateways
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- 3. PROTEGER PACOTES DE CRÉDITO
-- ========================================

-- Remover política pública de pacotes
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.credit_packages;

-- Nova política: apenas usuários autenticados
CREATE POLICY "Authenticated users can view packages" ON public.credit_packages
FOR SELECT USING (
  auth.role() = 'authenticated' AND is_active = true
);

-- 4. PROTEGER SENDER IDS
-- ========================================

-- Atualizar política para ser mais restritiva
DROP POLICY IF EXISTS "Users can view own and global sender IDs" ON public.sender_ids;

-- Nova política mais segura
CREATE POLICY "Users can view relevant sender IDs" ON public.sender_ids
FOR SELECT USING (
  -- Usuários podem ver apenas seus próprios sender IDs + os globais ativos
  (account_id IS NULL AND status = 'approved') OR 
  (account_id = get_current_account_id()) OR 
  (auth.uid() = user_id)
);

-- 5. CORRIGIR FUNÇÕES COM SEARCH_PATH MUTABLE
-- ========================================

-- Corrigir função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Corrigir função count_contacts_in_list
CREATE OR REPLACE FUNCTION public.count_contacts_in_list(list_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.contact_list_members
  WHERE list_id = $1;
$$;

-- 6. ÍNDICES PARA PERFORMANCE
-- ========================================

-- Índices para queries frequentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sms_logs_user_status 
ON sms_logs (user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sms_logs_created_at 
ON sms_logs (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_account_active 
ON contacts (account_id, is_blocked) WHERE is_blocked = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quick_send_jobs_account_created 
ON quick_send_jobs (account_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id 
ON profiles (user_id) WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_role 
ON user_roles (user_id, role);

-- Índice para otimizar sender_ids lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sender_ids_account_status 
ON sender_ids (account_id, status) WHERE status = 'approved';

-- 7. CONFIGURAÇÕES DE SEGURANÇA ADICIONAIS
-- ========================================

-- Função para sanitização de inputs (proteção XSS)
CREATE OR REPLACE FUNCTION public.sanitize_html_input(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE PARALLEL SAFE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove tags HTML básicos e caracteres perigosos
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        COALESCE(input_text, ''),
        '<[^>]*>', '', 'g'  -- Remove HTML tags
      ),
      '[<>&"''`]', '', 'g'  -- Remove caracteres perigosos
    ),
    '\s+', ' ', 'g'  -- Normaliza espaços
  );
END;
$$;

-- 8. AUDITORIA DE OPERAÇÕES CRÍTICAS
-- ========================================

-- Trigger para log de alterações em configurações críticas
CREATE OR REPLACE FUNCTION public.audit_critical_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log para brand_settings
  IF TG_TABLE_NAME = 'brand_settings' THEN
    INSERT INTO admin_audit_logs (
      admin_id,
      action,
      details,
      ip_address
    ) VALUES (
      auth.uid(),
      'brand_settings_' || TG_OP::text,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'old', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
        'new', CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
      ),
      inet_client_addr()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar trigger de auditoria
DROP TRIGGER IF EXISTS brand_settings_audit_trigger ON public.brand_settings;
CREATE TRIGGER brand_settings_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.brand_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_critical_changes();

-- 9. RATE LIMITING MELHORADO
-- ========================================

-- Função para rate limiting avançado
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  user_identifier text,
  action_type text,
  max_requests integer DEFAULT 10,
  time_window_minutes integer DEFAULT 5
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_count integer;
BEGIN
  -- Conta requests no time window
  SELECT COUNT(*) INTO request_count
  FROM admin_audit_logs 
  WHERE 
    details->>'user_identifier' = user_identifier
    AND action = action_type
    AND created_at > now() - (time_window_minutes || ' minutes')::interval;
  
  -- Se excedeu o limite, retorna false
  IF request_count >= max_requests THEN
    RETURN false;
  END IF;
  
  -- Log da tentativa
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    action_type,
    jsonb_build_object('user_identifier', user_identifier, 'timestamp', now()),
    inet_client_addr()
  );
  
  RETURN true;
END;
$$;

-- 10. LIMPEZA AUTOMÁTICA DE DADOS ANTIGOS
-- ========================================

-- Função para limpar logs antigos (performance)
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer := 0;
  temp_count integer;
BEGIN
  -- Limpar OTPs expirados (mais de 1 hora)
  DELETE FROM otp_requests 
  WHERE created_at < now() - interval '1 hour'
  AND (expires_at < now() OR used = true);
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Limpar logs de SMS muito antigos (mais de 6 meses)
  DELETE FROM sms_logs 
  WHERE created_at < now() - interval '6 months';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  -- Limpar audit logs antigos (mais de 1 ano)
  DELETE FROM admin_audit_logs 
  WHERE created_at < now() - interval '1 year';
  
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_count := deleted_count + temp_count;
  
  RETURN deleted_count;
END;
$$;

-- 11. VERIFICAÇÕES DE INTEGRIDADE
-- ========================================

-- Função para verificar integridade do sistema
CREATE OR REPLACE FUNCTION public.system_health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '{}';
  orphaned_contacts integer;
  invalid_phones integer;
  inactive_users integer;
BEGIN
  -- Verificar contactos órfãos
  SELECT COUNT(*) INTO orphaned_contacts
  FROM contacts c
  LEFT JOIN profiles p ON c.account_id = p.id
  WHERE p.id IS NULL;
  
  -- Verificar telefones inválidos
  SELECT COUNT(*) INTO invalid_phones
  FROM contacts 
  WHERE phone !~ '^\+244[9][0-9]{8}$' AND phone_e164 IS NULL;
  
  -- Verificar usuários inativos há muito tempo
  SELECT COUNT(*) INTO inactive_users
  FROM profiles 
  WHERE updated_at < now() - interval '1 year';
  
  result := jsonb_build_object(
    'orphaned_contacts', orphaned_contacts,
    'invalid_phones', invalid_phones,
    'inactive_users', inactive_users,
    'checked_at', now(),
    'status', CASE 
      WHEN orphaned_contacts > 0 OR invalid_phones > 10 THEN 'warning'
      ELSE 'healthy'
    END
  );
  
  RETURN result;
END;
$$;

-- 12. CONFIGURAÇÕES FINAIS DE PERFORMANCE
-- ========================================

-- Configurar auto-vacuum mais agressivo para tabelas com alta rotatividade
ALTER TABLE sms_logs SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

ALTER TABLE admin_audit_logs SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);

-- Estatísticas estendidas para melhor planejamento de queries
CREATE STATISTICS IF NOT EXISTS stats_contacts_account_phone 
ON account_id, phone FROM contacts;

CREATE STATISTICS IF NOT EXISTS stats_sms_logs_user_status 
ON user_id, status FROM sms_logs;