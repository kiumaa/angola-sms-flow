-- Reset credit packages to exactly the three specified
BEGIN;

-- Remove all existing packages to keep only the specified three
DELETE FROM public.credit_packages;

-- Insert the three new packages with final prices (including 12% service fee) and descriptions
INSERT INTO public.credit_packages (name, description, credits, price_kwanza, is_active)
VALUES
  ('Pacote Inicial', 'Perfeito para começar', 50, 4480, true),
  ('Pacote Médio', 'Ideal para empresas em crescimento', 150, 13037, true),
  ('Pacote Empresarial', 'Para grandes volumes e uso intensivo', 500, 43456, true);

COMMIT;