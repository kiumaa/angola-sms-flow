-- Estratégia alternativa: limpar transações e recriar pacotes

-- 1) Limpar referências package_id nas transações primeiro
UPDATE public.transactions SET package_id = NULL WHERE package_id IS NOT NULL;

-- 2) Agora podemos deletar os pacotes
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