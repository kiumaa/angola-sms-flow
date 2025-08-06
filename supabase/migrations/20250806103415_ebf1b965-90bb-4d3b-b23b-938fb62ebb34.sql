-- Tornar o campo campaign_id nullable para permitir envios de teste
ALTER TABLE public.sms_logs ALTER COLUMN campaign_id DROP NOT NULL;