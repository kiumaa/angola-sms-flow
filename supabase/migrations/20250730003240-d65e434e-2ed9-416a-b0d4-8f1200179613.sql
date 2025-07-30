-- Criar tabela para configurações do Routee
CREATE TABLE IF NOT EXISTS public.routee_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,
  api_token_encrypted text,
  webhook_url text,
  last_tested_at timestamp with time zone,
  test_status text,
  balance_eur numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.routee_settings ENABLE ROW LEVEL SECURITY;

-- Política para admins
CREATE POLICY "Only admins can manage Routee settings"
  ON public.routee_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_routee_settings_updated_at
  BEFORE UPDATE ON public.routee_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configuração inicial se não existir
INSERT INTO public.routee_settings (is_active, webhook_url, created_by)
SELECT 
  true,
  'https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/routee-webhook',
  (SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.routee_settings);