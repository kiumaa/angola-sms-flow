-- SECURITY FIX: Add operation_context to admin_audit_logs for better audit trail
-- First, update existing NULL admin_id rows to have 'system' context

ALTER TABLE public.admin_audit_logs 
ADD COLUMN IF NOT EXISTS operation_context text DEFAULT 'user';

-- Set operation_context for existing rows
UPDATE public.admin_audit_logs
SET operation_context = CASE
  WHEN admin_id IS NULL THEN 'system'
  WHEN EXISTS (SELECT 1 FROM user_roles WHERE user_id = admin_id AND role = 'admin'::app_role) THEN 'admin'
  WHEN admin_id IS NOT NULL THEN 'user'
  ELSE 'anonymous'
END
WHERE operation_context IS NULL OR operation_context = 'user';

-- Add index for operation context queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_operation_context 
ON public.admin_audit_logs(operation_context);

-- Now add the constraint
ALTER TABLE public.admin_audit_logs
DROP CONSTRAINT IF EXISTS valid_operation_context;

ALTER TABLE public.admin_audit_logs
ADD CONSTRAINT valid_operation_context CHECK (
  operation_context IN ('system', 'admin', 'user', 'anonymous')
);

COMMENT ON COLUMN public.admin_audit_logs.operation_context IS 'Distinguishes between system (service_role), admin, user, and anonymous operations for security audit trail';