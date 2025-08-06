-- Inserir o Sender ID padrão "SMSAO" como aprovado para todos os utilizadores admin
INSERT INTO public.sender_ids (user_id, sender_id, status, is_default, supported_gateways)
SELECT 
  ur.user_id,
  'SMSAO',
  'approved',
  true,
  ARRAY['bulksms']
FROM public.user_roles ur
WHERE ur.role = 'admin'
ON CONFLICT (user_id, sender_id) DO UPDATE SET
  status = 'approved',
  is_default = true,
  updated_at = now();