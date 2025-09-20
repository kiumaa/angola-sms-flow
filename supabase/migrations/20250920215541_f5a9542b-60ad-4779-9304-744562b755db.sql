-- Create package discounts table
CREATE TABLE public.package_discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.credit_packages(id) ON DELETE CASCADE,
  discount_percentage NUMERIC(5,2) CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.package_discounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage package discounts" 
ON public.package_discounts 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active discounts" 
ON public.package_discounts 
FOR SELECT 
USING (is_active = true AND valid_from <= now() AND (valid_until IS NULL OR valid_until > now()));

-- Create trigger for updated_at
CREATE TRIGGER update_package_discounts_updated_at
BEFORE UPDATE ON public.package_discounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create unique constraint to ensure only one active discount per package
CREATE UNIQUE INDEX unique_active_discount_per_package 
ON public.package_discounts (package_id) 
WHERE is_active = true;