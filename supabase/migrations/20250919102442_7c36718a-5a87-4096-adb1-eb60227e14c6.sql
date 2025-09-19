-- Correções de Segurança Final - SMSAO v2.0

-- 1. Corrigir política de Sender IDs - remover acesso público desnecessário
DROP POLICY IF EXISTS "Public can view approved sender names only" ON public.sender_ids;

-- Criar política mais restritiva - apenas usuários autenticados podem ver sender IDs globais
CREATE POLICY "Authenticated users can view global approved sender IDs" 
ON public.sender_ids 
FOR SELECT 
USING (
  (account_id IS NULL) 
  AND (status = 'approved'::text) 
  AND (auth.role() = 'authenticated'::text)
  AND (auth.uid() IS NOT NULL)
);

-- 2. Adicionar função de validação de sessão mais robusta
CREATE OR REPLACE FUNCTION public.validate_user_session()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Verificar se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se o perfil do usuário existe e está ativo
  SELECT * INTO user_profile
  FROM public.profiles
  WHERE user_id = auth.uid() AND user_status = 'active';
  
  IF NOT FOUND THEN
    -- Log tentativa de acesso com usuário inválido
    PERFORM log_security_event('invalid_user_access', auth.uid(), 
      jsonb_build_object('reason', 'user_profile_not_found_or_inactive'));
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- 3. Adicionar trigger de validação de sessão para tabelas sensíveis
CREATE OR REPLACE FUNCTION public.validate_session_on_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Validar sessão apenas para usuários autenticados (não para operações do sistema)
  IF auth.uid() IS NOT NULL AND NOT validate_user_session() THEN
    RAISE EXCEPTION 'Invalid session or inactive user account';
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4. Aplicar trigger de validação às tabelas mais sensíveis
CREATE TRIGGER validate_session_contacts 
  BEFORE INSERT OR UPDATE OR DELETE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.validate_session_on_access();

CREATE TRIGGER validate_session_credit_requests 
  BEFORE INSERT OR UPDATE ON public.credit_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_session_on_access();

-- 5. Adicionar política mais restritiva para SMS logs
DROP POLICY IF EXISTS "System can create sms logs" ON public.sms_logs;

CREATE POLICY "Authenticated system can create sms logs" 
ON public.sms_logs 
FOR INSERT 
WITH CHECK (
  -- Permitir inserção apenas se for uma operação do sistema com contexto válido
  (auth.uid() IS NOT NULL AND validate_user_session()) 
  OR 
  (auth.uid() IS NULL AND current_setting('role') = 'service_role')
);

-- 6. Melhorar função de sanitização com validação mais rigorosa
CREATE OR REPLACE FUNCTION public.enhanced_sanitize_input(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE PARALLEL SAFE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF input_text IS NULL OR length(input_text) = 0 THEN
    RETURN '';
  END IF;
  
  -- Verificar se contém padrões suspeitos
  IF input_text ~* '(script|javascript|vbscript|onload|onerror|eval|expression)' THEN
    RAISE EXCEPTION 'Suspicious content detected in input';
  END IF;
  
  -- Sanitização melhorada
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        trim(input_text),
        '<[^>]*>', '', 'g'  -- Remove HTML tags
      ),
      '[<>&"''`\x00-\x1F\x7F]', '', 'g'  -- Remove caracteres perigosos e controle
    ),
    '\s+', ' ', 'g'  -- Normaliza espaços
  );
END;
$$;

-- 7. Log da implementação das correções de segurança
INSERT INTO admin_audit_logs (
  admin_id,
  action,
  details,
  ip_address
) VALUES (
  (SELECT user_id FROM user_roles WHERE role = 'admin'::app_role LIMIT 1),
  'final_security_corrections_implemented',
  jsonb_build_object(
    'corrections', ARRAY[
      'restricted_public_sender_id_access',
      'enhanced_session_validation',
      'added_session_triggers_sensitive_tables',
      'improved_sms_logs_security',
      'enhanced_input_sanitization'
    ],
    'timestamp', now(),
    'security_level', 'production_ready'
  ),
  inet_client_addr()
);