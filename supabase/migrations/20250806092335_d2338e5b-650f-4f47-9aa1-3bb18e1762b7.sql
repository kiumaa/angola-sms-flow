-- Limpar registros duplicados na tabela routee_settings
DELETE FROM routee_settings WHERE id NOT IN (
  SELECT MIN(id) FROM routee_settings GROUP BY created_by
);

-- Se não houver registros, criar um registro padrão
INSERT INTO routee_settings (
  is_active,
  webhook_url,
  created_by
) 
SELECT 
  false,
  'https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/routee-webhook',
  '8a2544af-b71e-4e66-9068-fac3172bb791'
WHERE NOT EXISTS (SELECT 1 FROM routee_settings);

-- Adicionar constraint para garantir um único registro por usuário/sistema
ALTER TABLE routee_settings ADD CONSTRAINT unique_routee_config UNIQUE (created_by);