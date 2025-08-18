-- Add missing robots_index column to brand_settings table
ALTER TABLE public.brand_settings 
ADD COLUMN robots_index boolean DEFAULT true;