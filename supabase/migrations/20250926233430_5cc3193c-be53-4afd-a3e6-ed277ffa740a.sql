-- Criar tabela para solicitações LGPD
CREATE TABLE public.lgpd_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('data_export', 'data_deletion', 'data_correction', 'consent_withdrawal', 'data_portability')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  reason TEXT,
  user_email TEXT NOT NULL,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
  request_data JSONB DEFAULT '{}',
  response_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lgpd_requests ENABLE ROW LEVEL SECURITY;

-- Policies para lgpd_requests
CREATE POLICY "Users can create their own LGPD requests" 
ON public.lgpd_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own LGPD requests" 
ON public.lgpd_requests 
FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update LGPD requests" 
ON public.lgpd_requests 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete LGPD requests" 
ON public.lgpd_requests 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_lgpd_requests_updated_at
BEFORE UPDATE ON public.lgpd_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular score de compliance
CREATE OR REPLACE FUNCTION public.calculate_compliance_score()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb := '{}';
  total_users integer;
  users_with_consent integer;
  pending_requests integer;
  overdue_requests integer;
  score numeric := 0;
BEGIN
  -- Total de usuários
  SELECT COUNT(*) INTO total_users
  FROM public.profiles;
  
  -- Usuários com consentimento
  SELECT COUNT(DISTINCT user_id) INTO users_with_consent
  FROM public.user_consents;
  
  -- Solicitações pendentes
  SELECT COUNT(*) INTO pending_requests
  FROM public.lgpd_requests
  WHERE status = 'pending';
  
  -- Solicitações em atraso (mais de 30 dias)
  SELECT COUNT(*) INTO overdue_requests
  FROM public.lgpd_requests
  WHERE status = 'pending' 
    AND created_at < now() - INTERVAL '30 days';
  
  -- Calcular score (0-100)
  IF total_users > 0 THEN
    score := (users_with_consent::numeric / total_users::numeric) * 70; -- 70% do score vem do consentimento
    score := score + CASE 
      WHEN pending_requests = 0 THEN 20 -- 20% por não ter solicitações pendentes
      WHEN pending_requests <= 5 THEN 15
      WHEN pending_requests <= 10 THEN 10
      ELSE 5
    END;
    score := score + CASE 
      WHEN overdue_requests = 0 THEN 10 -- 10% por não ter solicitações em atraso
      ELSE GREATEST(0, 10 - overdue_requests * 2)
    END;
  END IF;
  
  result := jsonb_build_object(
    'score', LEAST(100, GREATEST(0, score)),
    'total_users', total_users,
    'users_with_consent', users_with_consent,
    'consent_percentage', CASE 
      WHEN total_users > 0 THEN (users_with_consent::numeric / total_users::numeric) * 100 
      ELSE 0 
    END,
    'pending_requests', pending_requests,
    'overdue_requests', overdue_requests,
    'calculated_at', now()
  );
  
  RETURN result;
END;
$$;

-- Função para processar solicitações LGPD
CREATE OR REPLACE FUNCTION public.process_lgpd_request(
  request_id UUID,
  admin_id UUID,
  action TEXT,
  response_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  request_record RECORD;
  result jsonb := '{}';
BEGIN
  -- Verificar se é admin
  IF NOT has_role(admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can process LGPD requests';
  END IF;
  
  -- Buscar a solicitação
  SELECT * INTO request_record 
  FROM public.lgpd_requests 
  WHERE id = request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'LGPD request not found';
  END IF;
  
  -- Atualizar status da solicitação
  UPDATE public.lgpd_requests
  SET 
    status = CASE 
      WHEN action = 'approve' THEN 'processing'
      WHEN action = 'complete' THEN 'completed'
      WHEN action = 'reject' THEN 'rejected'
      ELSE status
    END,
    processed_by = admin_id,
    processed_at = now(),
    response_data = jsonb_build_object(
      'action', action,
      'notes', response_notes,
      'processed_at', now(),
      'processed_by', admin_id
    ),
    updated_at = now()
  WHERE id = request_id;
  
  -- Log da ação
  INSERT INTO public.admin_audit_logs (
    admin_id,
    action,
    target_user_id,
    details,
    ip_address
  ) VALUES (
    admin_id,
    'lgpd_request_' || action,
    request_record.user_id,
    jsonb_build_object(
      'request_id', request_id,
      'request_type', request_record.request_type,
      'action', action,
      'notes', response_notes
    ),
    inet_client_addr()
  );
  
  result := jsonb_build_object(
    'success', true,
    'request_id', request_id,
    'action', action,
    'processed_at', now()
  );
  
  RETURN result;
END;
$$;