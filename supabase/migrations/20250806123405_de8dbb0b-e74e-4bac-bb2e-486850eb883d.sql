-- Adicionar coluna para saldo na configuração SMS
ALTER TABLE public.sms_configurations 
ADD COLUMN balance NUMERIC(10,2) DEFAULT 0,
ADD COLUMN last_balance_check TIMESTAMP WITH TIME ZONE DEFAULT now();