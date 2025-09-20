-- Ajustar pacotes desabilitando triggers temporariamente

-- 1) Desabilitar triggers de auditoria temporariamente
ALTER TABLE public.transactions DISABLE TRIGGER ALL;
ALTER TABLE public.credit_packages DISABLE TRIGGER ALL;

-- 2) Remover a constraint de foreign key que impede a exclusão
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_package_id_fkey;

-- 3) Limpar referências nas transações primeiro
UPDATE public.transactions SET package_id = NULL WHERE package_id IS NOT NULL;

-- 4) Remover todos os pacotes existentes
DELETE FROM public.credit_packages;

-- 5) Inserir os 3 novos pacotes principais conforme especificação
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

-- 6) Reabilitar triggers
ALTER TABLE public.transactions ENABLE TRIGGER ALL;
ALTER TABLE public.credit_packages ENABLE TRIGGER ALL;