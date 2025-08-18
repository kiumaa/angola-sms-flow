-- Fix credit adjustment type constraint to allow SMS debits
-- Drop the existing constraint
ALTER TABLE public.credit_adjustments DROP CONSTRAINT IF EXISTS credit_adjustments_adjustment_type_check;

-- Add new constraint with additional allowed values
ALTER TABLE public.credit_adjustments ADD CONSTRAINT credit_adjustments_adjustment_type_check 
CHECK (adjustment_type = ANY (ARRAY['manual'::text, 'purchase'::text, 'bonus'::text, 'refund'::text, 'sms_send'::text, 'campaign_debit'::text]));

-- Update the debit_user_credits function to use the correct adjustment type
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

  -- Verifica se tem créditos suficientes
  IF _current_credits < _amount THEN
    RETURN FALSE;
  END IF;

  -- Debita os créditos
  UPDATE profiles 
  SET credits = credits - _amount, updated_at = now()
  WHERE id = _account_id;

  -- Registra o ajuste de crédito
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
    _user_id, -- self-debit
    -_amount,
    _current_credits,
    _current_credits - _amount,
    _reason,
    'sms_send'  -- Changed from 'campaign_debit' to 'sms_send'
  );

  RETURN TRUE;
END;
$function$;