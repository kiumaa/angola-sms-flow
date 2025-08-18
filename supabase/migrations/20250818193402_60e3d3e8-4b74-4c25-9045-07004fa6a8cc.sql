-- Migration para sistema de personalização completo
DROP TABLE IF EXISTS brand_settings CASCADE;

CREATE TABLE brand_settings (
  id uuid primary key default gen_random_uuid(),
  -- Identidade
  site_title text not null default 'SMS AO',
  site_tagline text default 'Conectando empresas aos seus clientes através de SMS marketing eficiente e profissional',
  -- Paleta LIGHT
  light_primary text default '#1A1A1A',
  light_secondary text default '#666666', 
  light_bg text default '#F5F6F8',
  light_text text default '#1A1A1A',
  -- Paleta DARK
  dark_primary text default '#F5F6F8',
  dark_secondary text default '#9CA3AF',
  dark_bg text default '#0B0B0C', 
  dark_text text default '#ECECEC',
  -- Tipografia
  font_family text default 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial',
  font_scale jsonb default '{"xs":12,"sm":14,"base":16,"lg":18,"xl":20,"2xl":24}',
  -- Mídia
  logo_light_url text,       -- logo para fundo claro
  logo_dark_url text,        -- logo para fundo escuro
  favicon_url text,
  og_image_url text,
  -- SEO
  seo_title text,
  seo_description text,
  seo_canonical text,
  seo_twitter text default '@smsao',
  -- Avançado
  custom_css text,           -- opcional
  updated_at timestamptz default now()
);

-- Enable RLS
ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;

-- Policies para brand_settings
CREATE POLICY "Anyone can view brand settings for public pages"
ON brand_settings FOR SELECT
USING (true);

CREATE POLICY "Only admins can update brand settings"
ON brand_settings FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

CREATE POLICY "Only admins can insert brand settings"
ON brand_settings FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Criar storage bucket para branding se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para bucket branding
CREATE POLICY "Public can view branding files"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

CREATE POLICY "Only admins can upload branding files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'branding' AND EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

CREATE POLICY "Only admins can update branding files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'branding' AND EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

CREATE POLICY "Only admins can delete branding files"
ON storage.objects FOR DELETE
USING (bucket_id = 'branding' AND EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'::app_role
));

-- Apenas um registro (single-tenant). Criar se vazio:
INSERT INTO brand_settings (id) 
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM brand_settings);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_brand_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brand_settings_updated_at
  BEFORE UPDATE ON brand_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_settings_updated_at();