-- Limpar registros duplicados na tabela routee_settings
DELETE FROM routee_settings WHERE id::text NOT IN (
  SELECT id::text FROM routee_settings 
  WHERE created_by IS NOT NULL 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Limpar registros órfãos sem created_by
DELETE FROM routee_settings WHERE created_by IS NULL;

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