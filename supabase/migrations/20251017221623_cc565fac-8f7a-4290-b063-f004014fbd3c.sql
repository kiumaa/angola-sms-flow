-- Rewrite financial_rate_limit_check() to count by user instead of IP
-- This prevents false positives when service_role operations share the same IP

CREATE OR REPLACE FUNCTION public.financial_rate_limit_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  recent_attempts integer;
  current_user_id uuid := NEW.user_id;
BEGIN
  -- Rate limiting for financial transactions by USER (not IP)
  IF TG_OP = 'INSERT' THEN
    -- Count recent transaction attempts by this user
    SELECT COUNT(*) INTO recent_attempts
    FROM public.transactions
    WHERE user_id = current_user_id
      AND created_at > now() - INTERVAL '5 minutes';
    
    -- Allow max 5 attempts per 5 minutes per user
    IF recent_attempts >= 5 THEN
      RAISE EXCEPTION 'Financial rate limit exceeded: Too many transaction attempts. Please wait before trying again.';
    END IF;
    
    -- Additional check for high-value transactions (over 100,000 Kwanza)
    IF NEW.amount_kwanza > 100000 THEN
      SELECT COUNT(*) INTO recent_attempts
      FROM public.transactions
      WHERE user_id = current_user_id
        AND amount_kwanza > 100000
        AND created_at > now() - INTERVAL '5 minutes';
      
      -- Allow only 1 high-value transaction per 5 minutes
      IF recent_attempts >= 1 THEN
        RAISE EXCEPTION 'High-value transaction rate limit exceeded: Please wait 5 minutes between large transactions.';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;