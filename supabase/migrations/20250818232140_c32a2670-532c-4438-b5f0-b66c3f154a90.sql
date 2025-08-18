-- 1) Adicionar account_id nullable para permitir sender IDs globais
ALTER TABLE sender_ids ADD COLUMN IF NOT EXISTS account_id uuid;

-- 2) Migrar user_id existente para account_id (se ainda não foi feito)
UPDATE sender_ids 
SET account_id = (
  SELECT id FROM profiles WHERE profiles.user_id = sender_ids.user_id LIMIT 1
)
WHERE account_id IS NULL;

-- 3) PRIMEIRO: Remover duplicatas SMSAO criadas por usuários (antes da constraint)
DELETE FROM sender_ids
WHERE account_id IS NOT NULL
  AND LOWER(sender_id) = 'smsao';

-- 4) Criar o registro global SMSAO (se não existir)
INSERT INTO sender_ids (id, account_id, user_id, sender_id, status, bulksms_status, is_default, created_at)
SELECT 
  gen_random_uuid(), 
  NULL, 
  (SELECT id FROM auth.users ORDER BY created_at LIMIT 1), -- primeiro user como placeholder
  'SMSAO', 
  'approved', 
  'approved', 
  TRUE, 
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM sender_ids WHERE account_id IS NULL AND LOWER(sender_id) = 'smsao'
);

-- 5) AGORA: Constraint para prevenir novos SMSAO por usuário
ALTER TABLE sender_ids
  ADD CONSTRAINT sender_ids_smsao_global_only
  CHECK (
    NOT (LOWER(sender_id) = 'smsao' AND account_id IS NOT NULL)
  );

-- 6) Unicidade por escopo
CREATE UNIQUE INDEX IF NOT EXISTS ux_sender_global_value
  ON sender_ids (LOWER(sender_id))
  WHERE account_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_sender_account_value
  ON sender_ids (account_id, LOWER(sender_id))
  WHERE account_id IS NOT NULL;