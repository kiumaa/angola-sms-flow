-- Criar tabela ekwanza_payments
CREATE TABLE IF NOT EXISTS ekwanza_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  
  -- Método de pagamento
  payment_method TEXT NOT NULL CHECK (payment_method IN ('qrcode', 'mcx', 'referencia')),
  
  -- Dados do pedido
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  reference_code TEXT NOT NULL UNIQUE,
  mobile_number TEXT,
  
  -- Resposta É-kwanza
  ekwanza_code TEXT UNIQUE,
  ekwanza_operation_code TEXT,
  qr_code_base64 TEXT,
  reference_number TEXT,
  
  -- Status e datas
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled', 'failed')),
  expiration_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  
  -- Auditoria e debug
  callback_received_at TIMESTAMPTZ,
  raw_response JSONB,
  raw_callback JSONB
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ekwanza_payments_user_id ON ekwanza_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_ekwanza_payments_transaction_id ON ekwanza_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ekwanza_payments_reference_code ON ekwanza_payments(reference_code);
CREATE INDEX IF NOT EXISTS idx_ekwanza_payments_status ON ekwanza_payments(status);
CREATE INDEX IF NOT EXISTS idx_ekwanza_payments_ekwanza_code ON ekwanza_payments(ekwanza_code) WHERE ekwanza_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ekwanza_payments_created_at ON ekwanza_payments(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER set_ekwanza_payments_updated_at
  BEFORE UPDATE ON ekwanza_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Adicionar coluna payment_method na tabela transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'bank_transfer' 
CHECK (payment_method IN ('bank_transfer', 'qrcode', 'mcx', 'referencia'));

-- Índice para payment_method em transactions
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);

-- Enable RLS
ALTER TABLE ekwanza_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies para ekwanza_payments

-- Usuários veem apenas seus próprios pagamentos
CREATE POLICY "Users view own ekwanza payments"
  ON ekwanza_payments FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários criam seus próprios pagamentos
CREATE POLICY "Users create own ekwanza payments"
  ON ekwanza_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários não podem atualizar diretamente (apenas via edge functions)
CREATE POLICY "Users cannot update ekwanza payments"
  ON ekwanza_payments FOR UPDATE
  USING (false);

-- Admins podem gerenciar tudo
CREATE POLICY "Admins manage all ekwanza payments"
  ON ekwanza_payments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role pode gerenciar (necessário para webhooks)
CREATE POLICY "Service role manages ekwanza payments"
  ON ekwanza_payments FOR ALL
  USING (current_setting('role') = 'service_role');

-- Comentários para documentação
COMMENT ON TABLE ekwanza_payments IS 'Armazena pagamentos via É-kwanza (QR Code, Multicaixa Express, Referência EMIS)';
COMMENT ON COLUMN ekwanza_payments.payment_method IS 'Método de pagamento: qrcode, mcx (Multicaixa Express), ou referencia (Referência EMIS)';
COMMENT ON COLUMN ekwanza_payments.reference_code IS 'Código de referência único gerado pelo sistema (ex: SMSAO-timestamp-userid)';
COMMENT ON COLUMN ekwanza_payments.ekwanza_code IS 'Código retornado pela API É-kwanza para tracking';
COMMENT ON COLUMN ekwanza_payments.qr_code_base64 IS 'QR Code em base64 (apenas para método qrcode)';
COMMENT ON COLUMN ekwanza_payments.reference_number IS 'Número de referência EMIS (apenas para método referencia)';
COMMENT ON COLUMN ekwanza_payments.mobile_number IS 'Número de telefone do cliente (obrigatório para qrcode e mcx)';
COMMENT ON COLUMN ekwanza_payments.raw_response IS 'Resposta completa da API É-kwanza ao criar pagamento';
COMMENT ON COLUMN ekwanza_payments.raw_callback IS 'Dados recebidos no webhook de confirmação';