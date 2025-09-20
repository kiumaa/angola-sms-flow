-- Seed initial credit packages so pricing appears on the site
-- Safe inserts: only add if a package with the same name doesn't already exist

-- Starter
INSERT INTO public.credit_packages (name, description, credits, price_kwanza, is_active)
SELECT 'Starter', 'Perfeito para testes e pequenas campanhas', 500, 5000, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.credit_packages WHERE name = 'Starter'
);

-- Pro
INSERT INTO public.credit_packages (name, description, credits, price_kwanza, is_active)
SELECT 'Pro', 'Equilíbrio ideal para PMEs', 5000, 45000, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.credit_packages WHERE name = 'Pro'
);

-- Enterprise
INSERT INTO public.credit_packages (name, description, credits, price_kwanza, is_active)
SELECT 'Enterprise', 'Alto volume com melhor custo por SMS', 50000, 350000, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.credit_packages WHERE name = 'Enterprise'
);

-- Optional: ensure any inactive duplicates are visible only if activated (no-op here)
-- RLS already allows SELECT where is_active = true, so no policy changes required.
