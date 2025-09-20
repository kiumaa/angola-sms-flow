-- Primeiro, vou desativar o pacote empresarial com valores inválidos
UPDATE credit_packages 
SET is_active = false 
WHERE credits = 0 AND price_kwanza = 0;

-- Vou inserir pacotes válidos para testar
INSERT INTO credit_packages (name, description, credits, price_kwanza, is_active) VALUES
('Pacote Inicial', 'Perfeito para começar', 50, 4500, true),
('Pacote Profissional', 'Para uso profissional', 200, 18000, true),
('Pacote Empresarial', 'Para grandes empresas', 500, 42500, true)
ON CONFLICT (id) DO NOTHING;