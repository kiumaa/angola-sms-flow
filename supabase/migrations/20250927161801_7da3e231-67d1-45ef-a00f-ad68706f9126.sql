-- Drop the existing function and recreate with correct parameter name
DROP FUNCTION IF EXISTS public.distribute_admin_notification(uuid);

-- Create the distribute_admin_notification function with proper parameter naming
CREATE OR REPLACE FUNCTION public.distribute_admin_notification(p_notification_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_record RECORD;
  target_user_ids uuid[];
  user_count integer := 0;
  inserted_count integer := 0;
BEGIN
  -- Get notification details
  SELECT * INTO notification_record
  FROM public.admin_notifications
  WHERE id = p_notification_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Notification not found or inactive';
  END IF;
  
  -- Determine target users based on target_type
  CASE notification_record.target_type
    WHEN 'all' THEN
      -- All active users
      SELECT array_agg(user_id) INTO target_user_ids
      FROM public.profiles
      WHERE user_status = 'active';
      
    WHEN 'role' THEN
      -- Users with specific role
      SELECT array_agg(ur.user_id) INTO target_user_ids
      FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.user_id
      WHERE ur.role = notification_record.target_role::app_role
        AND p.user_status = 'active';
        
    WHEN 'specific' THEN
      -- Specific users from target_users array
      SELECT array_agg(user_id) INTO target_user_ids
      FROM public.profiles
      WHERE user_id = ANY(notification_record.target_users)
        AND user_status = 'active';
        
    ELSE
      RAISE EXCEPTION 'Invalid target_type: %', notification_record.target_type;
  END CASE;
  
  -- Count target users
  user_count := coalesce(array_length(target_user_ids, 1), 0);
  
  -- Insert user notifications
  IF user_count > 0 THEN
    INSERT INTO public.user_notifications (notification_id, user_id)
    SELECT p_notification_id, unnest(target_user_ids)
    ON CONFLICT (notification_id, user_id) DO NOTHING;
    
    -- Get count of actually inserted records
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
  END IF;
  
  -- Log the distribution
  INSERT INTO public.admin_audit_logs (
    admin_id,
    action,
    details,
    ip_address
  ) VALUES (
    notification_record.admin_id,
    'notification_distributed',
    jsonb_build_object(
      'notification_id', p_notification_id,
      'target_type', notification_record.target_type,
      'target_users_count', user_count,
      'distributed_count', inserted_count,
      'timestamp', now()
    ),
    inet_client_addr()
  );
  
  RETURN inserted_count;
END;
$$;