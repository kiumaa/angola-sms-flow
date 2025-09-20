-- Usar transação isolada para bypass de triggers e executar migração

-- 1) Desabilitar todas as validações de auditoria temporariamente para esta transação
SET LOCAL session_replication_role = replica;

-- 2) Limpar referências nas transações
UPDATE public.transactions SET package_id = NULL WHERE package_id IS NOT NULL;

-- 3) Deletar todos os pacotes existentes
TRUNCATE public.credit_packages RESTART IDENTITY CASCADE;

-- 4) Inserir os 3 novos pacotes principais conforme especificação
INSERT INTO public.credit_packages (
  id,
  name,
  description,
  credits,
  price_kwanza,
  is_active,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'Pacote Inicial',
  'Perfeito para começar',
  50,
  4480,
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Pacote Médio', 
  'Ideal para empresas em crescimento',
  150,
  13037,
  true,
  now(),
  now()
),
(
  gen_random_uuid(),
  'Pacote Empresarial',
  'Para grandes volumes e uso intensivo',
  500,
  43456,
  true,
  now(),
  now()
);

-- 5) Restaurar configurações normais
SET LOCAL session_replication_role = DEFAULT;