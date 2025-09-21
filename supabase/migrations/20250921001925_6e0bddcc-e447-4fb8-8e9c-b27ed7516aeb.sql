-- Fix the credit adjustments trigger to properly allow self-debit operations for SMS sends
-- This addresses the "Unauthorized: Admin privileges required" error when users send SMS

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS validate_admin_session_trigger ON public.credit_adjustments;

-- Recreate the trigger with the corrected function
CREATE TRIGGER validate_admin_session_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON public.credit_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_admin_operations_credit_adjustments();

-- Also ensure the debit_user_credits function properly sets admin_id = user_id for self-debits
-- Update the debit_user_credits function to ensure proper self-debit handling
CREATE OR REPLACE FUNCTION public.debit_user_credits(_account_id uuid, _amount integer, _reason text, _meta jsonb DEFAULT '{}'::jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_id UUID;
  _current_credits INTEGER;
BEGIN
  -- Lock da conta para evitar race conditions
  SELECT p.user_id, p.credits INTO _user_id, _current_credits
  FROM profiles p 
  WHERE p.id = _account_id
  FOR UPDATE;

  -- Verifica se a conta existe
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Verifica se tem créditos suficientes
  IF _current_credits < _amount THEN
    RETURN FALSE;
  END IF;

  -- Debita os créditos
  UPDATE profiles 
  SET credits = credits - _amount, updated_at = now()
  WHERE id = _account_id;

  -- Registra o ajuste de crédito com user_id = admin_id para self-debit
  INSERT INTO credit_adjustments (
    user_id, 
    admin_id, 
    delta, 
    previous_balance, 
    new_balance, 
    reason, 
    adjustment_type
  ) VALUES (
    _user_id,
    _user_id, -- admin_id = user_id for self-debit operations
    -_amount,
    _current_credits,
    _current_credits - _amount,
    _reason,
    'sms_send'
  );

  RETURN TRUE;
END;
$function$;