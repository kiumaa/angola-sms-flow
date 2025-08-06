-- Garantir que SMSAO existe como sender ID aprovado para todos os usuários
-- Esta é uma configuração padrão do sistema

-- Primeiro, vamos inserir o SMSAO como um sender ID de sistema (se não existir)
INSERT INTO public.sender_ids (
  id,
  user_id,
  sender_id,
  status,
  bulksms_status,
  bulkgate_status,
  supported_gateways,
  is_default,
  created_at,
  updated_at
) 
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid, -- System user
  'SMSAO',
  'approved',
  'approved',
  'approved',
  ARRAY['bulksms', 'bulkgate', 'africastalking'],
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.sender_ids WHERE sender_id = 'SMSAO' AND user_id = '00000000-0000-0000-0000-000000000000'::uuid
);

-- Atualizar política para permitir que todos vejam sender IDs do sistema
DROP POLICY IF EXISTS "Users can view own sender IDs" ON public.sender_ids;

CREATE POLICY "Users can view own sender IDs and system sender IDs" 
ON public.sender_ids 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR user_id = '00000000-0000-0000-0000-000000000000'::uuid  -- System sender IDs são visíveis para todos
);

-- Função para validar sender ID que inclui verificação de sender IDs de sistema
CREATE OR REPLACE FUNCTION validate_sender_id(
  p_user_id uuid,
  p_sender_id text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o sender ID está aprovado para o usuário ou é um sender ID de sistema
  RETURN EXISTS (
    SELECT 1 
    FROM public.sender_ids 
    WHERE sender_id = p_sender_id 
    AND status = 'approved'
    AND (
      user_id = p_user_id 
      OR user_id = '00000000-0000-0000-0000-000000000000'::uuid  -- System sender IDs
    )
  );
END;
$$;