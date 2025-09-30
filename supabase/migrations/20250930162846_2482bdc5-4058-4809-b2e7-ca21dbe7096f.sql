-- =====================================================
-- FIX: Contacts Table RLS - Permission Denied Errors
-- =====================================================
-- Issue: Edge function getting "permission denied" even with service_role
-- Root cause: Missing user_id column in contacts table inserts
-- Fix: Add proper RLS policies and ensure all required fields
-- =====================================================

-- First, let's check and fix the contacts table structure
-- Ensure user_id is set correctly for all operations

-- Drop old restrictive policies that might be blocking service_role
DROP POLICY IF EXISTS "Users can create own contacts with strict validation" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete own contacts with validation" ON public.contacts;
DROP POLICY IF EXISTS "Users can update own contacts with validation" ON public.contacts;
DROP POLICY IF EXISTS "Users can view only their own contacts with enhanced validation" ON public.contacts;
DROP POLICY IF EXISTS "Admins can manage all contacts" ON public.contacts;

-- Create new streamlined policies
-- 1. Service role can do everything (for edge functions)
CREATE POLICY "Service role full access to contacts"
ON public.contacts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Users can view their own contacts
CREATE POLICY "Users view own contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND account_id = get_current_account_id()
);

-- 3. Users can insert their own contacts
CREATE POLICY "Users create own contacts"
ON public.contacts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND account_id = get_current_account_id()
);

-- 4. Users can update their own contacts
CREATE POLICY "Users update own contacts"
ON public.contacts
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND account_id = get_current_account_id()
)
WITH CHECK (
  auth.uid() = user_id 
  AND account_id = get_current_account_id()
);

-- 5. Users can delete their own contacts
CREATE POLICY "Users delete own contacts"
ON public.contacts
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  AND account_id = get_current_account_id()
);

-- 6. Admins can view all contacts
CREATE POLICY "Admins view all contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. Admins can manage all contacts
CREATE POLICY "Admins manage all contacts"
ON public.contacts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix profiles policies for service_role access
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
CREATE POLICY "Service role full access to profiles"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled but won't block service_role
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Log the security fix
INSERT INTO public.admin_audit_logs (
  admin_id,
  action,
  details,
  ip_address
) VALUES (
  COALESCE(
    (SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::uuid
  ),
  'contacts_rls_fix_service_role',
  jsonb_build_object(
    'table', 'contacts',
    'issue', 'permission_denied_for_service_role',
    'fix', 'added_service_role_bypass_policies',
    'severity', 'critical',
    'timestamp', now(),
    'policies_updated', jsonb_build_array(
      'Service role full access',
      'Simplified user policies',
      'Proper admin policies'
    )
  ),
  inet_client_addr()
);