-- Fix Critical Security Vulnerability in Contacts Table
-- Issue: Users can view all contacts within the same account, not just their own
-- Solution: Restrict contact viewing to only the contact owner

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;

-- Create a more secure policy that ensures users can only view their own contacts
CREATE POLICY "Users can view only their own contacts" 
ON public.contacts 
FOR SELECT 
USING (
  (account_id = get_current_account_id()) AND 
  (user_id = auth.uid())
);

-- Also add additional security validation for contact access
CREATE OR REPLACE FUNCTION public.validate_contact_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log any attempts to access contacts that don't belong to the user
  IF TG_OP = 'SELECT' AND NEW.user_id != auth.uid() THEN
    PERFORM log_security_event('unauthorized_contact_access_attempt', auth.uid(), 
      jsonb_build_object(
        'attempted_contact_id', NEW.id,
        'contact_owner', NEW.user_id,
        'attempted_by', auth.uid(),
        'account_id', NEW.account_id,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add enhanced audit logging for contact operations
CREATE OR REPLACE FUNCTION public.audit_contact_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all contact operations with detailed information
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    target_user_id,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    'contact_' || TG_OP::text,
    COALESCE(NEW.user_id, OLD.user_id),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'contact_id', COALESCE(NEW.id, OLD.id),
      'contact_name', COALESCE(NEW.name, OLD.name),
      'contact_phone', 
        CASE 
          WHEN COALESCE(NEW.phone, OLD.phone) IS NOT NULL 
          THEN 'REDACTED_' || right(COALESCE(NEW.phone, OLD.phone), 4)
          ELSE NULL
        END,
      'account_id', COALESCE(NEW.account_id, OLD.account_id),
      'operation_timestamp', now(),
      'old_data', CASE WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
        'name', OLD.name,
        'phone_last_4', right(OLD.phone, 4),
        'email_domain', split_part(OLD.email, '@', 2)
      ) ELSE NULL END,
      'new_data', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN jsonb_build_object(
        'name', NEW.name,
        'phone_last_4', right(NEW.phone, 4),
        'email_domain', split_part(NEW.email, '@', 2)
      ) ELSE NULL END
    ),
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply audit logging to contacts table
CREATE TRIGGER audit_contact_operations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_contact_operations();

-- Create a function to securely count contacts for a user
CREATE OR REPLACE FUNCTION public.count_user_contacts(_user_id uuid DEFAULT auth.uid())
RETURNS integer AS $$
BEGIN
  -- Only allow users to count their own contacts or admins to count any
  IF _user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Can only count your own contacts';
  END IF;
  
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.contacts
    WHERE user_id = _user_id 
    AND account_id = get_current_account_id()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a function to validate contact data integrity
CREATE OR REPLACE FUNCTION public.validate_contact_data_integrity()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure contact belongs to the authenticated user
  IF NEW.user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot create contacts for other users';
  END IF;
  
  -- Ensure account_id matches the user's current account
  IF NEW.account_id != get_current_account_id() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot create contacts for other accounts';
  END IF;
  
  -- Validate phone number format for Angola
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^\+244[9][0-9]{8}$' THEN
    -- Log invalid phone format attempts
    PERFORM log_security_event('invalid_phone_format_attempt', auth.uid(), 
      jsonb_build_object(
        'provided_phone', 'REDACTED_' || right(NEW.phone, 4),
        'expected_format', '+244XXXXXXXXX',
        'contact_name', NEW.name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply data integrity validation to contacts
CREATE TRIGGER validate_contact_data_integrity_trigger
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_contact_data_integrity();

-- Add rate limiting for contact operations to prevent data harvesting
CREATE OR REPLACE FUNCTION public.rate_limit_contact_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- Rate limit contact creation (max 100 contacts per hour)
  IF TG_OP = 'INSERT' THEN
    IF NOT enhanced_security_rate_limit('contact_creation', 100, 60) THEN
      RAISE EXCEPTION 'Rate limit exceeded: Too many contacts created recently. Please wait before creating more contacts.';
    END IF;
  END IF;
  
  -- Rate limit contact bulk operations
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    IF NOT enhanced_security_rate_limit('contact_modification', 200, 60) THEN
      RAISE EXCEPTION 'Rate limit exceeded: Too many contact modifications. Please wait before continuing.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply rate limiting to contacts
CREATE TRIGGER rate_limit_contact_operations_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.rate_limit_contact_operations();