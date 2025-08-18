-- Atualizar RLS policies para suportar sender IDs globais
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
  (account_id = get_current_account_id()) AND
  (account_id IS NOT NULL)
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