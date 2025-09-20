-- Ativar pacotes principais para exibição
UPDATE credit_packages 
SET is_active = true, updated_at = now()
WHERE id IN (
  'df1fe00c-6f8d-4410-9388-016eb7c42e71', -- Pacote Inicial - 50 créditos
  '4f4f0d80-64e2-480d-9c03-a680a04f1e9c', -- Pacote Básico - 100 créditos  
  '775736f2-d496-4059-93a3-9ebd22fb5bf7', -- Pacote Médio - 400 créditos
  'd7048c1d-89f2-4869-8c70-cdf087ddf028'  -- Pacote Premium - 1000 créditos
);

-- Desativar pacotes duplicados ou desnecessários
UPDATE credit_packages 
SET is_active = false
WHERE id NOT IN (
  'df1fe00c-6f8d-4410-9388-016eb7c42e71',
  '4f4f0d80-64e2-480d-9c03-a680a04f1e9c', 
  '775736f2-d496-4059-93a3-9ebd22fb5bf7',
  'd7048c1d-89f2-4869-8c70-cdf087ddf028'
);

-- Corrigir preços para valores mais realistas (em Kwanzas)
UPDATE credit_packages SET 
  price_kwanza = 2500.00,
  description = 'Ideal para testes e pequenas campanhas'
WHERE id = 'df1fe00c-6f8d-4410-9388-016eb7c42e71';

UPDATE credit_packages SET 
  price_kwanza = 4500.00,
  description = 'Perfeito para pequenos negócios'
WHERE id = '4f4f0d80-64e2-480d-9c03-a680a04f1e9c';

UPDATE credit_packages SET 
  price_kwanza = 16000.00,
  description = 'Ideal para empresas em crescimento'
WHERE id = '775736f2-d496-4059-93a3-9ebd22fb5bf7';

UPDATE credit_packages SET 
  price_kwanza = 35000.00,
  description = 'Para grandes volumes e campanhas intensivas'
WHERE id = 'd7048c1d-89f2-4869-8c70-cdf087ddf028';