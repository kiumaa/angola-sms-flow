-- FASE 8: Criar tabela de métricas de pagamento para monitoramento em produção (CORRIGIDO)
CREATE TABLE IF NOT EXISTS public.payment_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('qrcode', 'mcx', 'referencia')),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  response_time_ms INTEGER,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID,
  amount NUMERIC,
  gateway_response JSONB
);

-- Index para queries de performance
CREATE INDEX idx_payment_metrics_created_at ON public.payment_metrics(created_at DESC);
CREATE INDEX idx_payment_metrics_method_status ON public.payment_metrics(payment_method, status);
CREATE INDEX idx_payment_metrics_user_id ON public.payment_metrics(user_id) WHERE user_id IS NOT NULL;

-- RLS Policies
ALTER TABLE public.payment_metrics ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todas as métricas
CREATE POLICY "Admins can view all payment metrics"
  ON public.payment_metrics
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role pode inserir métricas
CREATE POLICY "Service role can insert payment metrics"
  ON public.payment_metrics
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE public.payment_metrics IS 'Métricas de performance dos métodos de pagamento É-kwanza para monitoramento em produção';
COMMENT ON COLUMN public.payment_metrics.payment_method IS 'Método de pagamento: qrcode, mcx ou referencia';
COMMENT ON COLUMN public.payment_metrics.status IS 'Status da transação: success, error ou timeout';
COMMENT ON COLUMN public.payment_metrics.response_time_ms IS 'Tempo de resposta em milissegundos';
COMMENT ON COLUMN public.payment_metrics.gateway_response IS 'Resposta completa do gateway É-kwanza para debug';