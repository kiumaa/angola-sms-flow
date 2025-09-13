-- Corrigir search_path para funções de segurança
DROP FUNCTION IF EXISTS public.get_active_gateway_override();
DROP FUNCTION IF EXISTS public.set_gateway_override(TEXT, TIMESTAMP WITH TIME ZONE, TEXT);
DROP FUNCTION IF EXISTS public.get_effective_sender_id(UUID, TEXT);

-- Recriar funções com search_path correto
CREATE OR REPLACE FUNCTION public.get_active_gateway_override()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.set_gateway_override(
  _override_type TEXT,
  _expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  _reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  override_id UUID;
BEGIN
  -- Verificar se é admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can set gateway overrides';
  END IF;
  
  -- Desativar overrides anteriores
  UPDATE public.gateway_overrides SET is_active = false WHERE is_active = true;
  
  -- Criar novo override se não for 'none'
  IF _override_type != 'none' THEN
    INSERT INTO public.gateway_overrides (
      override_type,
      is_active,
      expires_at,
      created_by,
      reason
    ) VALUES (
      _override_type,
      true,
      _expires_at,
      auth.uid(),
      _reason
    ) RETURNING id INTO override_id;
    
    -- Log da ação
    INSERT INTO public.admin_audit_logs (
      admin_id,
      action,
      details,
      ip_address
    ) VALUES (
      auth.uid(),
      'gateway_override_set',
      jsonb_build_object(
        'override_type', _override_type,
        'expires_at', _expires_at,
        'reason', _reason
      ),
      inet_client_addr()
    );
  END IF;
  
  RETURN override_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_effective_sender_id(
  _user_id UUID,
  _requested_sender_id TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;