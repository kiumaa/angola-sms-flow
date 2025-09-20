-- Corrigir função de log para evitar admin_id NULL e depois ajustar pacotes

-- 1) Corrigir a função log_security_event para lidar com admin_id NULL
CREATE OR REPLACE FUNCTION public.log_security_event(event_type text, user_identifier uuid, details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_id_value uuid;
BEGIN
  -- Usar o primeiro admin disponível se user_identifier for NULL
  admin_id_value := COALESCE(
    user_identifier, 
    auth.uid(),
    (SELECT user_id FROM user_roles WHERE role = 'admin'::app_role LIMIT 1)
  );
  
  -- Só inserir se temos um admin_id válido
  IF admin_id_value IS NOT NULL THEN
    INSERT INTO admin_audit_logs (
      admin_id,
      action,
      target_user_id,
      details,
      ip_address
    ) VALUES (
      admin_id_value,
      'security_event_' || event_type,
      user_identifier,
      details || jsonb_build_object('timestamp', now(), 'session_id', auth.jwt() ->> 'session_id'),
      inet_client_addr()
    );
  END IF;
END;
$function$;

-- 2) Agora executar a migração dos pacotes
-- Limpar referências package_id nas transações primeiro
UPDATE public.transactions SET package_id = NULL WHERE package_id IS NOT NULL;

-- Deletar os pacotes existentes
DELETE FROM public.credit_packages;

-- Inserir os 3 novos pacotes principais conforme especificação
INSERT INTO public.credit_packages (
  id,
  name,
  description,
  credits,
  price_kwanza,
  is_active,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'Pacote Inicial',
  'Perfeito para começar',
  50,
  4480,
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Pacote Médio', 
  'Ideal para empresas em crescimento',
  150,
  13037,
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Pacote Empresarial',
  'Para grandes volumes e uso intensivo',
  500,
  43456,
  true,
  now(),
  now()
);