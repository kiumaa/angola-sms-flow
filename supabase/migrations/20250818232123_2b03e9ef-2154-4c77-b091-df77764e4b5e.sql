-- 1) Adicionar account_id nullable para permitir sender IDs globais
ALTER TABLE sender_ids ADD COLUMN account_id uuid;

-- 2) Migrar user_id existente para account_id (assumindo que são equivalentes)
UPDATE sender_ids SET account_id = (
  SELECT id FROM profiles WHERE profiles.user_id = sender_ids.user_id LIMIT 1
);

-- 3) Constraint: SMSAO só pode existir quando account_id IS NULL (global)
ALTER TABLE sender_ids
  ADD CONSTRAINT sender_ids_smsao_global_only
  CHECK (
    NOT (LOWER(sender_id) = 'smsao' AND account_id IS NOT NULL)
  );

-- 4) Unicidade por escopo
CREATE UNIQUE INDEX IF NOT EXISTS ux_sender_global_value
  ON sender_ids (LOWER(sender_id))
  WHERE account_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_sender_account_value
  ON sender_ids (account_id, LOWER(sender_id))
  WHERE account_id IS NOT NULL;

-- 5) Criar o registro global SMSAO (se não existir)
INSERT INTO sender_ids (id, account_id, user_id, sender_id, status, bulksms_status, is_default, created_at)
SELECT 
  gen_random_uuid(), 
  NULL, 
  (SELECT id FROM auth.users WHERE email = 'system@smsao.ao' LIMIT 1), -- user system placeholder
  'SMSAO', 
  'approved', 
  'approved', 
  TRUE, 
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM sender_ids WHERE account_id IS NULL AND LOWER(sender_id) = 'smsao'
);

-- 6) Remover duplicatas SMSAO criadas por usuários (manter apenas o global)
DELETE FROM sender_ids
WHERE account_id IS NOT NULL
  AND LOWER(sender_id) = 'smsao';

-- 7) Atualizar RLS policies para suportar sender IDs globais
DROP POLICY IF EXISTS "Users can view own sender IDs" ON sender_ids;
DROP POLICY IF EXISTS "Users can create own sender IDs" ON sender_ids;
DROP POLICY IF EXISTS "Users can update own sender IDs" ON sender_ids;

-- Nova policy: usuários podem ver seus próprios sender IDs E o global SMSAO
CREATE POLICY "Users can view own and global sender IDs" 
ON sender_ids 
FOR SELECT 
USING (
  (account_id IS NULL) OR 
  (account_id = get_current_account_id()) OR 
  (auth.uid() = user_id)
);

-- Policy para criação: usuários só podem criar sender IDs próprios (não SMSAO)
CREATE POLICY "Users can create own sender IDs (not SMSAO)" 
ON sender_ids 
FOR INSERT 
WITH CHECK (
  (auth.uid() = user_id) AND 
  (account_id = get_current_account_id()) AND
  (LOWER(sender_id) != 'smsao')
);

-- Policy para update: usuários só podem atualizar seus próprios
CREATE POLICY "Users can update own sender IDs" 
ON sender_ids 
FOR UPDATE 
USING (
  (auth.uid() = user_id) AND 
  (account_id = get_current_account_id())
);

-- Policy para delete: usuários só podem deletar seus próprios (não o global)
CREATE POLICY "Users can delete own sender IDs" 
ON sender_ids 
FOR DELETE 
USING (
  (auth.uid() = user_id) AND 
  (account_id = get_current_account_id()) AND
  (account_id IS NOT NULL)
);