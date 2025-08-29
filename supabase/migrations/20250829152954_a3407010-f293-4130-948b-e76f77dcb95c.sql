-- Fix enhanced_audit_logging function to handle NULL auth.uid() during automatic user creation
CREATE OR REPLACE FUNCTION public.enhanced_audit_logging()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log if auth.uid() is not NULL (skip during automatic user creation)
  IF auth.uid() IS NOT NULL THEN
    -- Log all admin operations with enhanced details
    IF TG_TABLE_NAME = 'user_roles' THEN
      INSERT INTO admin_audit_logs (
        admin_id,
        action,
        target_user_id,
        details,
        ip_address
      ) VALUES (
        auth.uid(),
        'user_role_' || TG_OP::text,
        COALESCE(NEW.user_id, OLD.user_id),
        jsonb_build_object(
          'table', TG_TABLE_NAME,
          'old_role', CASE WHEN TG_OP != 'INSERT' THEN OLD.role ELSE NULL END,
          'new_role', CASE WHEN TG_OP != 'DELETE' THEN NEW.role ELSE NULL END,
          'timestamp', now()
        ),
        inet_client_addr()
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$