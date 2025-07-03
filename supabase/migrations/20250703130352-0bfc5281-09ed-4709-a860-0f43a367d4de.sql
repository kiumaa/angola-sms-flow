-- Criar tabelas para gestão de contatos

-- 1. Tabela de contatos individuais
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, phone)
);

-- 2. Tabela de listas de contatos
CREATE TABLE public.contact_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabela de relacionamento (muitos para muitos)
CREATE TABLE public.contact_list_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES public.contact_lists(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id, list_id)
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_list_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies para contacts
CREATE POLICY "Users can manage own contacts" ON public.contacts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all contacts" ON public.contacts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para contact_lists
CREATE POLICY "Users can manage own contact lists" ON public.contact_lists
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all contact lists" ON public.contact_lists
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para contact_list_members
CREATE POLICY "Users can manage own contact list members" ON public.contact_list_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.contact_lists cl 
      WHERE cl.id = list_id AND cl.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all contact list members" ON public.contact_list_members
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Triggers para updated_at
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_lists_updated_at
  BEFORE UPDATE ON public.contact_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para contar contatos em uma lista
CREATE OR REPLACE FUNCTION public.count_contacts_in_list(list_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.contact_list_members
  WHERE list_id = $1
$$;