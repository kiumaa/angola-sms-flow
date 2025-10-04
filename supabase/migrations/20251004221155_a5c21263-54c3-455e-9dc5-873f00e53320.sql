-- Phase 3: Strengthen contact_tag_pivot RLS policies
-- Improves performance and prevents potential timing attacks

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all contact tag relationships" ON public.contact_tag_pivot;
DROP POLICY IF EXISTS "Users can manage own contact tag relationships" ON public.contact_tag_pivot;

-- Create optimized policies with direct checks
-- Admin policy
CREATE POLICY "Admins can manage all contact tag relationships"
ON public.contact_tag_pivot
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- User policy with improved performance
CREATE POLICY "Users can manage own contact tag relationships"
ON public.contact_tag_pivot
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM contacts c
    WHERE c.id = contact_tag_pivot.contact_id
      AND c.user_id = auth.uid()
      AND c.account_id = get_current_account_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM contacts c
    WHERE c.id = contact_tag_pivot.contact_id
      AND c.user_id = auth.uid()
      AND c.account_id = get_current_account_id()
  )
);

-- Add index to improve RLS policy performance and prevent timing attacks
CREATE INDEX IF NOT EXISTS idx_contact_tag_pivot_contact_id 
ON public.contact_tag_pivot(contact_id);

CREATE INDEX IF NOT EXISTS idx_contacts_user_account 
ON public.contacts(user_id, account_id, id);