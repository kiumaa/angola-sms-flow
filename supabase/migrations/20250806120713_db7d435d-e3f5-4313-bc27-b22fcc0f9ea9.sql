-- Insert default SMSAO sender ID that's approved for all users
INSERT INTO public.sender_ids (
  user_id,
  sender_id,
  status,
  bulksms_status,
  bulkgate_status,
  supported_gateways,
  is_default
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- System user ID
  'SMSAO',
  'approved',
  'approved', 
  'approved',
  ARRAY['bulksms', 'bulkgate'],
  true
) ON CONFLICT (user_id, sender_id) DO UPDATE SET
  status = 'approved',
  bulksms_status = 'approved',
  bulkgate_status = 'approved',
  supported_gateways = ARRAY['bulksms', 'bulkgate'],
  is_default = true;

-- Create a policy to allow all authenticated users to view the system SMSAO sender ID
CREATE POLICY "Users can view system SMSAO sender ID" 
ON public.sender_ids 
FOR SELECT 
USING (sender_id = 'SMSAO' AND user_id = '00000000-0000-0000-0000-000000000000');

-- Update the send-sms function validation to check for system sender IDs
CREATE OR REPLACE FUNCTION public.validate_sender_id(
  p_user_id uuid,
  p_sender_id text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if it's the default system SMSAO
  IF p_sender_id = 'SMSAO' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.sender_ids 
      WHERE sender_id = 'SMSAO' 
      AND user_id = '00000000-0000-0000-0000-000000000000'
      AND status = 'approved'
    );
  END IF;
  
  -- Check user's own approved sender IDs
  RETURN EXISTS (
    SELECT 1 FROM public.sender_ids 
    WHERE user_id = p_user_id 
    AND sender_id = p_sender_id 
    AND status = 'approved'
  );
END;
$$;