-- Function to distribute admin notifications to users
CREATE OR REPLACE FUNCTION public.distribute_admin_notification(notification_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  notification_record RECORD;
  target_users_cursor CURSOR FOR
    SELECT user_id FROM profiles WHERE user_status = 'active';
  target_role_cursor CURSOR(role_param app_role) FOR
    SELECT ur.user_id FROM user_roles ur 
    JOIN profiles p ON ur.user_id = p.user_id 
    WHERE ur.role = role_param AND p.user_status = 'active';
  user_record RECORD;
  distributed_count integer := 0;
BEGIN
  -- Get notification details
  SELECT * INTO notification_record
  FROM admin_notifications
  WHERE id = notification_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Notification not found or inactive';
  END IF;
  
  -- Distribute based on target type
  CASE notification_record.target_type
    WHEN 'all' THEN
      -- Send to all active users
      FOR user_record IN target_users_cursor LOOP
        INSERT INTO user_notifications (notification_id, user_id)
        VALUES (notification_id, user_record.user_id)
        ON CONFLICT (notification_id, user_id) DO NOTHING;
        
        -- Check if insert was successful
        IF FOUND THEN
          distributed_count := distributed_count + 1;
        END IF;
      END LOOP;
      
    WHEN 'role' THEN
      -- Send to users with specific role
      IF notification_record.target_role IS NOT NULL THEN
        FOR user_record IN target_role_cursor(notification_record.target_role) LOOP
          INSERT INTO user_notifications (notification_id, user_id)
          VALUES (notification_id, user_record.user_id)
          ON CONFLICT (notification_id, user_id) DO NOTHING;
          
          -- Check if insert was successful
          IF FOUND THEN
            distributed_count := distributed_count + 1;
          END IF;
        END LOOP;
      END IF;
      
    WHEN 'specific' THEN
      -- Send to specific users (if implemented in the future)
      IF notification_record.target_users IS NOT NULL THEN
        INSERT INTO user_notifications (notification_id, user_id)
        SELECT notification_id, unnest(notification_record.target_users)
        ON CONFLICT (notification_id, user_id) DO NOTHING;
        
        GET DIAGNOSTICS distributed_count = ROW_COUNT;
      END IF;
  END CASE;
  
  -- Log the distribution
  INSERT INTO admin_audit_logs (
    admin_id,
    action,
    details,
    ip_address
  ) VALUES (
    notification_record.admin_id,
    'notification_distributed',
    jsonb_build_object(
      'notification_id', notification_id,
      'target_type', notification_record.target_type,
      'distributed_count', distributed_count,
      'priority', notification_record.priority
    ),
    inet_client_addr()
  );
  
  RETURN distributed_count;
END;
$function$;

-- Add unique constraint to prevent duplicate user notifications
ALTER TABLE user_notifications 
ADD CONSTRAINT user_notifications_unique 
UNIQUE (notification_id, user_id);