-- Criar tabela para preços por país
CREATE TABLE public.country_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL UNIQUE,
  country_name TEXT NOT NULL,
  credits_multiplier NUMERIC NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.country_pricing ENABLE ROW LEVEL SECURITY;

-- Policies para country_pricing
CREATE POLICY "Admins can manage country pricing"
ON public.country_pricing
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active country pricing"
ON public.country_pricing
FOR SELECT
USING (is_active = true);

-- Inserir dados iniciais
INSERT INTO public.country_pricing (country_code, country_name, credits_multiplier) VALUES
('+244', 'Angola', 1),
('+239', 'São Tomé e Príncipe', 1),
('+258', 'Moçambique', 2),
('+238', 'Cabo Verde', 2),
('+245', 'Guiné-Bissau', 3);

-- Adicionar campos para tracking de países nas tabelas existentes
ALTER TABLE public.sms_logs ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE public.sms_logs ADD COLUMN IF NOT EXISTS credits_multiplier NUMERIC DEFAULT 1;

ALTER TABLE public.quick_send_targets ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE public.quick_send_targets ADD COLUMN IF NOT EXISTS credits_multiplier NUMERIC DEFAULT 1;

ALTER TABLE public.campaign_targets ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE public.campaign_targets ADD COLUMN IF NOT EXISTS credits_multiplier NUMERIC DEFAULT 1;

-- Adicionar flag para créditos grátis
ALTER TABLE public.credit_adjustments ADD COLUMN IF NOT EXISTS is_free_credit BOOLEAN DEFAULT false;

-- Marcar créditos de boas-vindas existentes como grátis
UPDATE public.credit_adjustments 
SET is_free_credit = true 
WHERE reason ILIKE '%boas-vindas%' OR reason ILIKE '%welcome%' OR adjustment_type = 'welcome_bonus';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_country_pricing_updated_at
BEFORE UPDATE ON public.country_pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();