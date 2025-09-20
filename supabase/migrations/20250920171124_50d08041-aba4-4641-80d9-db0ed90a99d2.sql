-- Desativar todos os pacotes existentes para manter histórico
UPDATE public.credit_packages SET is_active = false WHERE is_active = true;

-- Criar os 3 novos pacotes de créditos
INSERT INTO public.credit_packages (name, description, credits, price_kwanza, is_active) VALUES
('Pacote Inicial', 'Perfeito para começar', 50, 4480, true),
('Pacote Médio', 'Ideal para empresas em crescimento', 150, 13037, true),
('Pacote Empresarial', 'Para grandes volumes e uso intensivo', 500, 43456, true);