-- Criar tabela de gateways SMS
CREATE TABLE public.sms_gateways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'bulksms' | 'bulkgate'
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  api_endpoint TEXT NOT NULL,
  auth_type TEXT NOT NULL, -- 'basic' | 'bearer'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir gateways padrão
INSERT INTO public.sms_gateways (name, display_name, is_active, is_primary, api_endpoint, auth_type) VALUES
('bulksms', 'BulkSMS', true, true, 'https://api.bulksms.com/v1', 'basic'),
('bulkgate', 'BulkGate', false, false, 'https://api.bulkgate.com/v2.0', 'bearer');

-- Atualizar tabela sender_ids para suportar múltiplos gateways
ALTER TABLE public.sender_ids 
ADD COLUMN bulksms_status TEXT DEFAULT 'pending',
ADD COLUMN bulkgate_status TEXT DEFAULT 'pending', 
ADD COLUMN supported_gateways TEXT[] DEFAULT ARRAY['bulksms'];

-- Atualizar registros existentes
UPDATE public.sender_ids SET bulksms_status = 'approved' WHERE status = 'approved';

-- Atualizar tabela sms_logs para rastrear gateways
ALTER TABLE public.sms_logs 
ADD COLUMN gateway_used TEXT DEFAULT 'bulksms',
ADD COLUMN gateway_message_id TEXT,
ADD COLUMN fallback_attempted BOOLEAN DEFAULT false,
ADD COLUMN original_gateway TEXT;

-- Políticas RLS para sms_gateways
ALTER TABLE public.sms_gateways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all gateways" 
ON public.sms_gateways 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active gateways" 
ON public.sms_gateways 
FOR SELECT 
USING (is_active = true);

-- Trigger para updated_at
CREATE TRIGGER update_sms_gateways_updated_at
BEFORE UPDATE ON public.sms_gateways
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para garantir que apenas um gateway seja primário
CREATE OR REPLACE FUNCTION ensure_single_primary_gateway()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Desativar todos os outros gateways como primário
    UPDATE public.sms_gateways 
    SET is_primary = false 
    WHERE id != NEW.id AND is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary_gateway_trigger
BEFORE UPDATE ON public.sms_gateways
FOR EACH ROW
EXECUTE FUNCTION ensure_single_primary_gateway();