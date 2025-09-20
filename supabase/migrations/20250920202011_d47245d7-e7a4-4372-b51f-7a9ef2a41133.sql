-- Manter apenas 3 pacotes principais ativos
UPDATE credit_packages 
SET is_active = false
WHERE id = 'df1fe00c-6f8d-4410-9388-016eb7c42e71'; -- Desativar pacote de 50 créditos

-- Garantir que apenas os 3 pacotes principais estão ativos
UPDATE credit_packages 
SET is_active = true, updated_at = now()
WHERE id IN (
  '4f4f0d80-64e2-480d-9c03-a680a04f1e9c', -- Pacote Básico - 100 créditos  
  '775736f2-d496-4059-93a3-9ebd22fb5bf7', -- Pacote Médio - 400 créditos
  'd7048c1d-89f2-4869-8c70-cdf087ddf028'  -- Pacote Premium - 1000 créditos
);

-- Atualizar nomes para melhor identificação
UPDATE credit_packages SET 
  name = 'Pacote Básico',
  description = 'Perfeito para pequenos negócios'
WHERE id = '4f4f0d80-64e2-480d-9c03-a680a04f1e9c';

UPDATE credit_packages SET 
  name = 'Pacote Médio',
  description = 'Ideal para empresas em crescimento'
WHERE id = '775736f2-d496-4059-93a3-9ebd22fb5bf7';

UPDATE credit_packages SET 
  name = 'Pacote Premium',
  description = 'Para grandes volumes e campanhas intensivas'
WHERE id = 'd7048c1d-89f2-4869-8c70-cdf087ddf028';