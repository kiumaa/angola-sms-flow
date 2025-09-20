DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'credit_packages' 
      AND policyname = 'Public can view active packages'
  ) THEN
    CREATE POLICY "Public can view active packages"
    ON public.credit_packages
    FOR SELECT
    TO anon
    USING (is_active = true);
  END IF;
END$$;