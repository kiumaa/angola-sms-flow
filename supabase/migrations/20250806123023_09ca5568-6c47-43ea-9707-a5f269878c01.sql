-- Criar tabela para configurações SMS
CREATE TABLE public.sms_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gateway_name TEXT NOT NULL,
  api_token_id TEXT,
  api_token_secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(gateway_name)
);

-- Habilitar RLS
ALTER TABLE public.sms_configurations ENABLE ROW LEVEL SECURITY;

-- Políticas para admins apenas
CREATE POLICY "Admins can manage SMS configurations" 
ON public.sms_configurations 
FOR ALL 
USING (auth.uid() IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
));

-- Trigger para updated_at
CREATE TRIGGER update_sms_configurations_updated_at
BEFORE UPDATE ON public.sms_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();