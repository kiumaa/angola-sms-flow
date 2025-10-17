-- Fix debit_user_credits to log into sms_logs using correct columns
CREATE OR REPLACE FUNCTION public.debit_user_credits(
  _user_id uuid,
  _account_id uuid,
  _credits integer,
  _reference text DEFAULT NULL::text,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_credits INTEGER;
  new_credits INTEGER;
  transaction_id UUID;
BEGIN
  -- Get current credits and lock row
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = _account_id AND user_id = _user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Account not found'
    );
  END IF;

  -- Check balance
  IF current_credits < _credits THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient credits',
      'current_credits', current_credits,
      'required_credits', _credits
    );
  END IF;

  -- Debit
  new_credits := current_credits - _credits;

  UPDATE public.profiles
  SET 
    credits = new_credits,
    updated_at = now()
  WHERE id = _account_id AND user_id = _user_id;

  -- Log debit in sms_logs using existing columns
  BEGIN
    INSERT INTO public.sms_logs (
      user_id,
      phone_number,
      message,
      status,
      cost_credits,
      gateway_used,
      created_at,
      payload
    ) VALUES (
      _user_id,
      COALESCE(_reference, 'system_event'),
      'Credit debit: ' || _credits || ' credits',
      'completed',
      _credits,
      'system',
      now(),
      _metadata
    )
    RETURNING id INTO transaction_id;
  EXCEPTION WHEN OTHERS THEN
    -- Do not fail debit if logging encounters a schema/policy issue
    transaction_id := NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'previous_credits', current_credits,
    'debited_credits', _credits,
    'new_credits', new_credits,
    'transaction_id', transaction_id
  );
END;
$$;