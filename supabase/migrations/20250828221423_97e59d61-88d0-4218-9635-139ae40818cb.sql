-- Update brand settings with the new logo URLs
UPDATE brand_settings 
SET 
  logo_light_url = '/src/assets/logo-light.png',
  logo_dark_url = '/src/assets/logo-dark.png'
WHERE id = (SELECT id FROM brand_settings LIMIT 1);

-- If no brand settings exist, create them
INSERT INTO brand_settings (logo_light_url, logo_dark_url)
SELECT '/src/assets/logo-light.png', '/src/assets/logo-dark.png'
WHERE NOT EXISTS (SELECT 1 FROM brand_settings);