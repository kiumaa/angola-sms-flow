-- Create admin notifications table
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'specific', 'role')),
  target_users UUID[] DEFAULT NULL,
  target_role app_role DEFAULT NULL,
  priority TEXT NOT NULL DEFAULT 'info' CHECK (priority IN ('info', 'warning', 'urgent')),
  category TEXT DEFAULT 'general',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user notifications tracking table
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.admin_notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_notifications
CREATE POLICY "Only admins can manage admin notifications"
ON public.admin_notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_notifications
CREATE POLICY "Admins can view all user notifications"
ON public.user_notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own notifications"
ON public.user_notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.user_notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can create user notifications"
ON public.user_notifications
FOR INSERT
WITH CHECK (current_setting('role') = 'service_role' OR has_role(auth.uid(), 'admin'::app_role));

-- Create triggers
CREATE TRIGGER update_admin_notifications_updated_at
BEFORE UPDATE ON public.admin_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to distribute notifications to users
CREATE OR REPLACE FUNCTION public.distribute_admin_notification(notification_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_record RECORD;
  target_user_ids UUID[];
  user_id UUID;
  inserted_count INTEGER := 0;
BEGIN
  -- Get notification details
  SELECT * INTO notification_record
  FROM public.admin_notifications
  WHERE id = notification_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Determine target users
  IF notification_record.target_type = 'all' THEN
    SELECT ARRAY_AGG(p.user_id) INTO target_user_ids
    FROM public.profiles p
    WHERE p.user_status = 'active';
  ELSIF notification_record.target_type = 'specific' THEN
    target_user_ids := notification_record.target_users;
  ELSIF notification_record.target_type = 'role' THEN
    SELECT ARRAY_AGG(ur.user_id) INTO target_user_ids
    FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.user_id
    WHERE ur.role = notification_record.target_role 
    AND p.user_status = 'active';
  END IF;
  
  -- Insert notifications for each target user
  IF target_user_ids IS NOT NULL THEN
    FOREACH user_id IN ARRAY target_user_ids
    LOOP
      INSERT INTO public.user_notifications (notification_id, user_id)
      VALUES (notification_id, user_id)
      ON CONFLICT (notification_id, user_id) DO NOTHING;
      
      IF FOUND THEN
        inserted_count := inserted_count + 1;
      END IF;
    END LOOP;
  END IF;
  
  RETURN inserted_count;
END;
$$;