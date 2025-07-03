-- Create function to add credits to user
CREATE OR REPLACE FUNCTION add_user_credits(user_id uuid, credit_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET credits = COALESCE(credits, 0) + credit_amount,
      updated_at = now()
  WHERE profiles.user_id = add_user_credits.user_id;
END;
$$;