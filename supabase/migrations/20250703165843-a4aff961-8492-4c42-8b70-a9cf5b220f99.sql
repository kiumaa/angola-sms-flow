-- Add site title and subtitle fields to brand_settings table
ALTER TABLE public.brand_settings 
ADD COLUMN site_title TEXT DEFAULT 'SMS Marketing Angola',
ADD COLUMN site_subtitle TEXT DEFAULT 'Conectando empresas aos seus clientes através de SMS marketing eficiente e profissional';