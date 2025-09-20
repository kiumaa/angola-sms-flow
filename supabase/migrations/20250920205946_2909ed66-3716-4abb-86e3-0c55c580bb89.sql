-- Ajustar pacotes removendo constraint de FK e recriando conforme especificação

-- 1) Remover a constraint de foreign key que impede a exclusão
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_package_id_fkey;

-- 2) Remover todos os pacotes existentes
DELETE FROM public.credit_packages;

-- 3) Inserir os 3 novos pacotes principais conforme especificação
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

-- 4) Limpar referências órfãs nas transações (opcional - definir package_id como NULL para transações antigas)
UPDATE public.transactions SET package_id = NULL WHERE package_id IS NOT NULL;