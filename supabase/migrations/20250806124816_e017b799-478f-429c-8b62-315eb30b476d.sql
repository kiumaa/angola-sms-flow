-- Extend brand_settings table to support comprehensive customization
ALTER TABLE public.brand_settings 
ADD COLUMN IF NOT EXISTS background_color text DEFAULT 'hsl(220, 14%, 96%)',
ADD COLUMN IF NOT EXISTS text_color text DEFAULT 'hsl(220, 39%, 11%)',
ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS font_weight text DEFAULT '300',
ADD COLUMN IF NOT EXISTS font_sizes jsonb DEFAULT '{
  "h1": "1.75rem",
  "h2": "1.25rem", 
  "h3": "1rem",
  "body": "1rem",
  "small": "0.875rem"
}'::jsonb,
ADD COLUMN IF NOT EXISTS line_height text DEFAULT '1.5',
ADD COLUMN IF NOT EXISTS letter_spacing text DEFAULT '-0.01em',
ADD COLUMN IF NOT EXISTS meta_title_template text DEFAULT '{{page}} · {{siteTitle}}',
ADD COLUMN IF NOT EXISTS meta_description text DEFAULT 'Plataforma de SMS Marketing para Angola',
ADD COLUMN IF NOT EXISTS og_image_url text,
ADD COLUMN IF NOT EXISTS og_title text,
ADD COLUMN IF NOT EXISTS og_description text,
ADD COLUMN IF NOT EXISTS robots_index boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS robots_follow boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS theme_mode text DEFAULT 'system',
ADD COLUMN IF NOT EXISTS custom_css text,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;