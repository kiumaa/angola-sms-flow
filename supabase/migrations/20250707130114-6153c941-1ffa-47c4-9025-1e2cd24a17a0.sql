-- Allow public access to brand settings for landing page
CREATE POLICY "Anyone can view brand settings for public pages" 
ON public.brand_settings 
FOR SELECT 
USING (true);