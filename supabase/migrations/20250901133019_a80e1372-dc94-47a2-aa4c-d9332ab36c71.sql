-- Enhance country_pricing table for multi-gateway support
ALTER TABLE public.country_pricing 
ADD COLUMN IF NOT EXISTS preferred_gateway text DEFAULT 'bulksms',
ADD COLUMN IF NOT EXISTS gateway_cost_multiplier jsonb DEFAULT '{"bulksms": 1.0, "bulkgate": 1.0}'::jsonb;

-- Update existing records with appropriate gateway preferences
UPDATE public.country_pricing 
SET preferred_gateway = 'bulkgate'
WHERE country_code IN ('AO', 'MZ', 'CV', 'GW', 'ST', 'TL');

-- Create gateway routing rules table
CREATE TABLE IF NOT EXISTS public.gateway_routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  primary_gateway text NOT NULL,
  fallback_gateway text,
  cost_threshold numeric DEFAULT 0.1,
  priority_order jsonb DEFAULT '["bulksms", "bulkgate"]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on gateway routing rules
ALTER TABLE public.gateway_routing_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for gateway routing rules
CREATE POLICY "Admins can manage gateway routing rules"
ON public.gateway_routing_rules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active routing rules"
ON public.gateway_routing_rules
FOR SELECT
USING (is_active = true);

-- Insert default routing rules
INSERT INTO public.gateway_routing_rules (country_code, primary_gateway, fallback_gateway) 
VALUES 
  ('AO', 'bulkgate', 'bulksms'),
  ('MZ', 'bulkgate', 'bulksms'),
  ('CV', 'bulkgate', 'bulksms'),
  ('GW', 'bulkgate', 'bulksms'),
  ('ST', 'bulkgate', 'bulksms'),
  ('TL', 'bulkgate', 'bulksms'),
  ('PT', 'bulksms', 'bulkgate'),
  ('BR', 'bulksms', 'bulkgate'),
  ('DEFAULT', 'bulksms', 'bulkgate')
ON CONFLICT DO NOTHING;

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER gateway_routing_rules_updated_at
  BEFORE UPDATE ON public.gateway_routing_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enhance sms_logs table for better multi-gateway tracking
ALTER TABLE public.sms_logs 
ADD COLUMN IF NOT EXISTS routing_decision jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS gateway_priority text DEFAULT 'primary',
ADD COLUMN IF NOT EXISTS country_detected text,
ADD COLUMN IF NOT EXISTS cost_optimization boolean DEFAULT false;

-- Create index for better performance on gateway queries
CREATE INDEX IF NOT EXISTS idx_sms_logs_gateway_country 
ON public.sms_logs(gateway_used, country_detected, created_at);

CREATE INDEX IF NOT EXISTS idx_sms_logs_fallback 
ON public.sms_logs(fallback_attempted, created_at) 
WHERE fallback_attempted = true;