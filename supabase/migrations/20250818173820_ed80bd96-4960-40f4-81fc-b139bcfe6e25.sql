-- PR-4: Complete Contact Management System

-- First, let's update existing contacts table to match PR-4 requirements
ALTER TABLE public.contacts 
  ADD COLUMN IF NOT EXISTS account_id uuid,
  ADD COLUMN IF NOT EXISTS phone_e164 text,
  ADD COLUMN IF NOT EXISTS attributes jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- Migrate existing data: use user_id as account_id for now
UPDATE public.contacts SET account_id = user_id WHERE account_id IS NULL;
UPDATE public.contacts SET phone_e164 = phone WHERE phone_e164 IS NULL AND phone IS NOT NULL;

-- Make account_id not null after migration
ALTER TABLE public.contacts ALTER COLUMN account_id SET NOT NULL;

-- Create unique index for account + phone
CREATE UNIQUE INDEX IF NOT EXISTS u_contacts_account_phone
  ON public.contacts (account_id, phone_e164);

-- Contact Tags table
CREATE TABLE IF NOT EXISTS public.contact_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#6B7280',
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS u_contact_tags_account_name
  ON public.contact_tags (account_id, lower(name));

-- Contact-Tag pivot table
CREATE TABLE IF NOT EXISTS public.contact_tag_pivot (
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES public.contact_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (contact_id, tag_id)
);

-- Update contact_lists to use account_id and add rule field
ALTER TABLE public.contact_lists 
  ADD COLUMN IF NOT EXISTS account_id uuid,
  ADD COLUMN IF NOT EXISTS rule jsonb DEFAULT '{"all":[]}'::jsonb;

-- Migrate existing data
UPDATE public.contact_lists SET account_id = user_id WHERE account_id IS NULL;
ALTER TABLE public.contact_lists ALTER COLUMN account_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS u_contact_lists_account_name
  ON public.contact_lists (account_id, lower(name));

-- Contact import jobs table
CREATE TABLE IF NOT EXISTS public.contact_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  file_path text NOT NULL,
  original_name text,
  status text NOT NULL DEFAULT 'queued',
  totals jsonb DEFAULT '{}'::jsonb,
  error text,
  created_at timestamptz DEFAULT now(),
  finished_at timestamptz
);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at() 
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now(); 
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS trg_contacts_updated ON public.contacts;
CREATE TRIGGER trg_contacts_updated
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_contact_lists_updated ON public.contact_lists;
CREATE TRIGGER trg_contact_lists_updated
  BEFORE UPDATE ON public.contact_lists
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Enable RLS on new tables
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tag_pivot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_import_jobs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current account ID from profiles
CREATE OR REPLACE FUNCTION public.get_current_account_id()
RETURNS uuid AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RLS Policies for contact_tags
CREATE POLICY "Users can manage own contact tags" ON public.contact_tags
  FOR ALL USING (account_id = public.get_current_account_id());

CREATE POLICY "Admins can manage all contact tags" ON public.contact_tags
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for contact_tag_pivot
CREATE POLICY "Users can manage own contact tag relationships" ON public.contact_tag_pivot
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.contacts c 
    WHERE c.id = contact_id AND c.account_id = public.get_current_account_id()
  ));

CREATE POLICY "Admins can manage all contact tag relationships" ON public.contact_tag_pivot
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for contact_import_jobs  
CREATE POLICY "Users can manage own import jobs" ON public.contact_import_jobs
  FOR ALL USING (account_id = public.get_current_account_id());

CREATE POLICY "Admins can manage all import jobs" ON public.contact_import_jobs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Update existing RLS policies to use account_id
DROP POLICY IF EXISTS "Users can manage own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins can view all contacts" ON public.contacts;

CREATE POLICY "Users can manage own contacts" ON public.contacts
  FOR ALL USING (account_id = public.get_current_account_id() OR user_id = auth.uid());

CREATE POLICY "Admins can manage all contacts" ON public.contacts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Update contact_lists RLS policies
DROP POLICY IF EXISTS "Users can manage own contact lists" ON public.contact_lists;
DROP POLICY IF EXISTS "Admins can view all contact lists" ON public.contact_lists;

CREATE POLICY "Users can manage own contact lists" ON public.contact_lists
  FOR ALL USING (account_id = public.get_current_account_id() OR user_id = auth.uid());

CREATE POLICY "Admins can manage all contact lists" ON public.contact_lists
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Update contact_list_members RLS policies  
DROP POLICY IF EXISTS "Users can manage own contact list members" ON public.contact_list_members;
DROP POLICY IF EXISTS "Admins can view all contact list members" ON public.contact_list_members;

CREATE POLICY "Users can manage own contact list members" ON public.contact_list_members
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.contact_lists cl 
    WHERE cl.id = contact_list_members.list_id 
    AND (cl.account_id = public.get_current_account_id() OR cl.user_id = auth.uid())
  ));

CREATE POLICY "Admins can manage all contact list members" ON public.contact_list_members
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));