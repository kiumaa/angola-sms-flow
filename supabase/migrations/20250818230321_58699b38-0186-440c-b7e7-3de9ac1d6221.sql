-- Add missing robots_follow column to brand_settings table
ALTER TABLE public.brand_settings 
ADD COLUMN robots_follow boolean DEFAULT true;