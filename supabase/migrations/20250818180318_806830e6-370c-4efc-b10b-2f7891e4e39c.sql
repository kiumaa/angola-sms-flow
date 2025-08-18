-- Campanhas
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  name TEXT NOT NULL,
  message_template TEXT NOT NULL,           -- suporta placeholders {{name}}, {{attributes.empresa}}, etc.
  sender_id TEXT,                           -- se null usar SMSAO
  schedule_at TIMESTAMPTZ,                  -- null = enviar agora
  timezone TEXT DEFAULT 'Africa/Luanda',
  status TEXT NOT NULL DEFAULT 'draft',     -- draft|queued|sending|paused|completed|failed|canceled
  total_targets INTEGER DEFAULT 0,
  est_credits INTEGER DEFAULT 0,            -- estimativa antes do envio
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_account ON campaigns(account_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS t_campaigns_updated ON campaigns;
CREATE TRIGGER t_campaigns_updated 
  BEFORE UPDATE ON campaigns 
  FOR EACH ROW 
  EXECUTE PROCEDURE set_updated_at();

-- Alvos/recipientes da campanha (snapshot do momento do envio)
CREATE TABLE IF NOT EXISTS campaign_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  account_id UUID NOT NULL,
  contact_id UUID,                           -- pode ser null se foi inserido ad-hoc
  phone_e164 TEXT NOT NULL,                  -- +2449XXXXXXXX
  rendered_message TEXT,                     -- mensagem final após merge
  segments SMALLINT NOT NULL DEFAULT 1,      -- 1..n considerando GSM7/Unicode e concat
  status TEXT NOT NULL DEFAULT 'queued',     -- queued|sending|sent|failed|delivered|undeliverable|ignored
  tries SMALLINT DEFAULT 0,
  bulksms_message_id TEXT,
  error_code TEXT,
  error_detail TEXT,
  cost_credits INTEGER DEFAULT 0,
  queued_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_targets_campaign ON campaign_targets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_targets_status ON campaign_targets(status);
CREATE INDEX IF NOT EXISTS idx_targets_bulksms ON campaign_targets(bulksms_message_id);

-- Estatísticas consolidadas por campanha (atualizadas pelo worker/webhook)
CREATE TABLE IF NOT EXISTS campaign_stats (
  campaign_id UUID PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
  queued INTEGER DEFAULT 0,
  sending INTEGER DEFAULT 0,
  sent INTEGER DEFAULT 0,
  delivered INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  undeliverable INTEGER DEFAULT 0,
  credits_spent INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Templates reutilizáveis
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS u_msg_templates_account_name 
  ON message_templates(account_id, lower(name));

-- RLS Policies para campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all campaigns" 
  ON campaigns FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage own campaigns" 
  ON campaigns FOR ALL TO authenticated 
  USING (account_id = get_current_account_id());

-- RLS Policies para campaign_targets
ALTER TABLE campaign_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all campaign targets" 
  ON campaign_targets FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage own campaign targets" 
  ON campaign_targets FOR ALL TO authenticated 
  USING (account_id = get_current_account_id());

-- RLS Policies para campaign_stats
ALTER TABLE campaign_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all campaign stats" 
  ON campaign_stats FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own campaign stats" 
  ON campaign_stats FOR SELECT TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.id = campaign_stats.campaign_id 
    AND c.account_id = get_current_account_id()
  ));

CREATE POLICY "System can update campaign stats" 
  ON campaign_stats FOR ALL TO authenticated 
  USING (true)
  WITH CHECK (true);

-- RLS Policies para message_templates
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all message templates" 
  ON message_templates FOR ALL TO authenticated 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage own message templates" 
  ON message_templates FOR ALL TO authenticated 
  USING (account_id = get_current_account_id());

-- Função para debitar créditos atomicamente
CREATE OR REPLACE FUNCTION debit_user_credits(
  _account_id UUID,
  _amount INTEGER,
  _reason TEXT,
  _meta JSONB DEFAULT '{}'::jsonb
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id UUID;
  _current_credits INTEGER;
BEGIN
  -- Lock da conta para evitar race conditions
  SELECT p.user_id, p.credits INTO _user_id, _current_credits
  FROM profiles p 
  WHERE p.id = _account_id
  FOR UPDATE;

  -- Verifica se tem créditos suficientes
  IF _current_credits < _amount THEN
    RETURN FALSE;
  END IF;

  -- Debita os créditos
  UPDATE profiles 
  SET credits = credits - _amount, updated_at = now()
  WHERE id = _account_id;

  -- Registra o ajuste de crédito
  INSERT INTO credit_adjustments (
    user_id, 
    admin_id, 
    delta, 
    previous_balance, 
    new_balance, 
    reason, 
    adjustment_type
  ) VALUES (
    _user_id,
    _user_id, -- self-debit
    -_amount,
    _current_credits,
    _current_credits - _amount,
    _reason,
    'campaign_debit'
  );

  RETURN TRUE;
END;
$$;

-- Função para atualizar estatísticas de campanha
CREATE OR REPLACE FUNCTION update_campaign_stats(_campaign_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO campaign_stats (
    campaign_id,
    queued,
    sending, 
    sent,
    delivered,
    failed,
    undeliverable,
    credits_spent,
    updated_at
  )
  SELECT 
    _campaign_id,
    COUNT(*) FILTER (WHERE status = 'queued'),
    COUNT(*) FILTER (WHERE status = 'sending'),
    COUNT(*) FILTER (WHERE status = 'sent'),
    COUNT(*) FILTER (WHERE status = 'delivered'),
    COUNT(*) FILTER (WHERE status = 'failed'),
    COUNT(*) FILTER (WHERE status = 'undeliverable'),
    COALESCE(SUM(cost_credits), 0),
    now()
  FROM campaign_targets 
  WHERE campaign_id = _campaign_id
  ON CONFLICT (campaign_id) DO UPDATE SET
    queued = EXCLUDED.queued,
    sending = EXCLUDED.sending,
    sent = EXCLUDED.sent,
    delivered = EXCLUDED.delivered,
    failed = EXCLUDED.failed,
    undeliverable = EXCLUDED.undeliverable,
    credits_spent = EXCLUDED.credits_spent,
    updated_at = EXCLUDED.updated_at;
END;
$$;