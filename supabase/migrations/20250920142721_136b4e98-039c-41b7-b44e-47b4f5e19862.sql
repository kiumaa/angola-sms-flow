-- Fix Critical Security Vulnerabilities in Financial Transactions Table
-- Issue: Potential unauthorized access to sensitive financial data
-- Solution: Implement comprehensive security measures for financial transactions

-- First, drop existing policies to rebuild with enhanced security
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Only admins can delete transactions" ON public.transactions;
DROP POLICY IF EXISTS "Only admins can modify transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create own transactions only" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions only" ON public.transactions;

-- Create enhanced RLS policies with comprehensive security checks
CREATE POLICY "Users can view only their own transactions with validation" 
ON public.transactions 
FOR SELECT 
USING (
  (user_id = auth.uid()) AND 
  (auth.uid() IS NOT NULL) AND
  validate_user_session()
);

CREATE POLICY "Users can create own transactions with strict validation" 
ON public.transactions 
FOR INSERT 
WITH CHECK (
  (user_id = auth.uid()) AND 
  (auth.uid() IS NOT NULL) AND
  validate_user_session() AND
  enhanced_security_rate_limit('transaction_creation', 5, 60) -- Max 5 transactions per hour
);

CREATE POLICY "Only verified admins can view all transactions" 
ON public.transactions 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  enhanced_security_rate_limit('admin_transaction_access', 100, 5) -- Rate limit admin access
);

CREATE POLICY "Only verified admins can modify transactions with audit" 
ON public.transactions 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  enhanced_security_rate_limit('admin_transaction_modify', 20, 5)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Only verified admins can delete transactions with audit" 
ON public.transactions 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role) AND
  enhanced_security_rate_limit('admin_transaction_delete', 5, 60)
);

CREATE POLICY "Service role can manage transactions for system operations" 
ON public.transactions 
FOR ALL 
USING (
  current_setting('role') = 'service_role'
)
WITH CHECK (
  current_setting('role') = 'service_role'
);

-- Create comprehensive financial audit logging function
CREATE OR REPLACE FUNCTION public.audit_financial_transactions()
RETURNS TRIGGER AS $$
BEGIN
  -- Log all financial transaction operations with enhanced security
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    target_user_id,
    details,
    ip_address
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'financial_transaction_' || TG_OP::text,
    COALESCE(NEW.user_id, OLD.user_id),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'transaction_id', COALESCE(NEW.id, OLD.id),
      'amount_category', 
        CASE 
          WHEN COALESCE(NEW.amount_kwanza, OLD.amount_kwanza) < 1000 THEN 'small'
          WHEN COALESCE(NEW.amount_kwanza, OLD.amount_kwanza) < 10000 THEN 'medium'
          WHEN COALESCE(NEW.amount_kwanza, OLD.amount_kwanza) < 100000 THEN 'large'
          ELSE 'very_large'
        END,
      'credits_purchased', COALESCE(NEW.credits_purchased, OLD.credits_purchased),
      'status', COALESCE(NEW.status, OLD.status),
      'payment_method', COALESCE(NEW.payment_method, OLD.payment_method),
      'payment_reference_hash', 
        CASE 
          WHEN COALESCE(NEW.payment_reference, OLD.payment_reference) IS NOT NULL 
          THEN md5(COALESCE(NEW.payment_reference, OLD.payment_reference))
          ELSE NULL
        END,
      'operation_timestamp', now(),
      'role', current_setting('role'),
      'session_validated', validate_user_session(),
      'security_level', 
        CASE 
          WHEN current_setting('role') = 'service_role' THEN 'system'
          WHEN has_role(auth.uid(), 'admin'::app_role) THEN 'admin'
          ELSE 'user'
        END
    ),
    inet_client_addr()
  );
  
  -- Log high-value transactions separately for enhanced monitoring
  IF COALESCE(NEW.amount_kwanza, OLD.amount_kwanza) > 50000 THEN
    PERFORM log_security_event('high_value_transaction', 
      COALESCE(NEW.user_id, OLD.user_id), 
      jsonb_build_object(
        'transaction_id', COALESCE(NEW.id, OLD.id),
        'operation', TG_OP,
        'amount_category', 'high_value',
        'requires_review', true
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply comprehensive audit logging to transactions
CREATE TRIGGER audit_financial_transactions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_financial_transactions();

-- Create function to validate financial transaction data
CREATE OR REPLACE FUNCTION public.validate_financial_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate transaction belongs to authenticated user (except for admins/service role)
  IF NEW.user_id != auth.uid() 
     AND NOT has_role(auth.uid(), 'admin'::app_role) 
     AND current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Cannot create transactions for other users';
  END IF;
  
  -- Validate financial amounts
  IF NEW.amount_kwanza IS NOT NULL AND NEW.amount_kwanza <= 0 THEN
    PERFORM log_security_event('invalid_transaction_amount', auth.uid(), 
      jsonb_build_object(
        'provided_amount', NEW.amount_kwanza,
        'transaction_id', NEW.id
      )
    );
    RAISE EXCEPTION 'Invalid transaction amount: Amount must be positive';
  END IF;
  
  -- Validate credits purchased
  IF NEW.credits_purchased IS NOT NULL AND NEW.credits_purchased <= 0 THEN
    RAISE EXCEPTION 'Invalid credits amount: Credits must be positive';
  END IF;
  
  -- Validate payment reference format if provided
  IF NEW.payment_reference IS NOT NULL AND length(NEW.payment_reference) < 3 THEN
    PERFORM log_security_event('invalid_payment_reference', auth.uid(), 
      jsonb_build_object(
        'reference_length', length(NEW.payment_reference),
        'transaction_id', NEW.id
      )
    );
    RAISE EXCEPTION 'Invalid payment reference: Must be at least 3 characters';
  END IF;
  
  -- Log suspicious transaction patterns
  IF NEW.amount_kwanza > 1000000 THEN -- Transactions over 1M Kwanza
    PERFORM log_security_event('large_transaction_attempt', auth.uid(), 
      jsonb_build_object(
        'amount_category', 'extremely_large',
        'transaction_id', NEW.id,
        'requires_manual_review', true
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply financial validation to transactions
CREATE TRIGGER validate_financial_transaction_trigger
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_financial_transaction();

-- Create function to securely get transaction statistics
CREATE OR REPLACE FUNCTION public.get_user_transaction_summary(_user_id uuid DEFAULT auth.uid())
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- Only allow users to get their own summary or admins to get any
  IF _user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Can only access your own transaction summary';
  END IF;
  
  SELECT jsonb_build_object(
    'total_transactions', COUNT(*),
    'total_spent', COALESCE(SUM(amount_kwanza), 0),
    'total_credits_purchased', COALESCE(SUM(credits_purchased), 0),
    'pending_transactions', COUNT(*) FILTER (WHERE status = 'pending'),
    'completed_transactions', COUNT(*) FILTER (WHERE status = 'completed'),
    'failed_transactions', COUNT(*) FILTER (WHERE status = 'failed'),
    'last_transaction_date', MAX(created_at),
    'avg_transaction_amount', COALESCE(AVG(amount_kwanza), 0)
  ) INTO result
  FROM public.transactions
  WHERE user_id = _user_id;
  
  -- Log summary access
  PERFORM log_security_event('transaction_summary_accessed', _user_id, 
    jsonb_build_object(
      'requested_by', auth.uid(),
      'summary_for', _user_id,
      'timestamp', now()
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to encrypt sensitive payment references
CREATE OR REPLACE FUNCTION public.encrypt_payment_reference(ref_text text)
RETURNS text AS $$
BEGIN
  -- Simple encryption using base64 encoding (in production, use proper encryption)
  -- This is a placeholder - in production you'd use pgcrypto or similar
  RETURN encode(ref_text::bytea, 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to decrypt payment references (admin only)
CREATE OR REPLACE FUNCTION public.decrypt_payment_reference(encrypted_ref text)
RETURNS text AS $$
BEGIN
  -- Only admins can decrypt payment references
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can decrypt payment references';
  END IF;
  
  -- Log decryption access
  PERFORM log_security_event('payment_reference_decrypted', auth.uid(), 
    jsonb_build_object(
      'timestamp', now(),
      'admin_id', auth.uid()
    )
  );
  
  -- Simple decryption (in production, use proper decryption)
  RETURN convert_from(decode(encrypted_ref, 'base64'), 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create enhanced rate limiting specifically for financial operations
CREATE OR REPLACE FUNCTION public.financial_rate_limit_check()
RETURNS TRIGGER AS $$
BEGIN
  -- Strict rate limiting for financial transactions
  IF TG_OP = 'INSERT' THEN
    -- Prevent rapid transaction creation
    IF NOT enhanced_security_rate_limit('financial_transaction', 3, 60) THEN
      RAISE EXCEPTION 'Financial rate limit exceeded: Too many transaction attempts. Please wait before trying again.';
    END IF;
    
    -- Additional check for high-value transactions
    IF NEW.amount_kwanza > 100000 THEN
      IF NOT enhanced_security_rate_limit('high_value_transaction', 1, 300) THEN -- 1 per 5 minutes
        RAISE EXCEPTION 'High-value transaction rate limit exceeded: Please wait 5 minutes between large transactions.';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply financial rate limiting
CREATE TRIGGER financial_rate_limit_check_trigger
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.financial_rate_limit_check();