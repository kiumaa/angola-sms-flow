-- Criar tabela para conversas de suporte
CREATE TABLE public.support_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL,
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category text DEFAULT 'general' CHECK (category IN ('general', 'technical', 'billing', 'feature_request')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_message_at timestamp with time zone DEFAULT now(),
  unread_admin_count integer DEFAULT 0,
  unread_user_count integer DEFAULT 0
);

-- Criar tabela para mensagens do chat
CREATE TABLE public.support_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  attachment_url text,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone
);

-- Habilitar RLS
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para support_conversations
CREATE POLICY "Admins can manage all conversations" 
ON public.support_conversations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own conversations" 
ON public.support_conversations 
FOR SELECT 
USING (auth.uid() = user_id AND account_id = get_current_account_id());

CREATE POLICY "Users can create own conversations" 
ON public.support_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND account_id = get_current_account_id());

CREATE POLICY "Users can update own conversations" 
ON public.support_conversations 
FOR UPDATE 
USING (auth.uid() = user_id AND account_id = get_current_account_id());

-- Políticas para support_messages
CREATE POLICY "Admins can manage all messages" 
ON public.support_messages 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view messages from own conversations" 
ON public.support_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.support_conversations 
    WHERE id = conversation_id 
    AND user_id = auth.uid()
    AND account_id = get_current_account_id()
  )
);

CREATE POLICY "Users can send messages to own conversations" 
ON public.support_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id 
  AND EXISTS (
    SELECT 1 FROM public.support_conversations 
    WHERE id = conversation_id 
    AND user_id = auth.uid()
    AND account_id = get_current_account_id()
  )
);

-- Índices para performance
CREATE INDEX idx_support_conversations_user_id ON public.support_conversations(user_id);
CREATE INDEX idx_support_conversations_admin_id ON public.support_conversations(admin_id);
CREATE INDEX idx_support_conversations_status ON public.support_conversations(status);
CREATE INDEX idx_support_conversations_last_message_at ON public.support_conversations(last_message_at DESC);
CREATE INDEX idx_support_messages_conversation_id ON public.support_messages(conversation_id);
CREATE INDEX idx_support_messages_created_at ON public.support_messages(created_at DESC);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_support_conversations_updated_at
  BEFORE UPDATE ON public.support_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_messages_updated_at
  BEFORE UPDATE ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar contadores de mensagens não lidas
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Atualizar last_message_at e contadores
  UPDATE public.support_conversations
  SET 
    last_message_at = NEW.created_at,
    unread_admin_count = CASE 
      WHEN NEW.is_admin = false THEN unread_admin_count + 1 
      ELSE unread_admin_count 
    END,
    unread_user_count = CASE 
      WHEN NEW.is_admin = true THEN unread_user_count + 1 
      ELSE unread_user_count 
    END,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$function$;

-- Trigger para atualizar conversation quando nova mensagem é criada
CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_on_message();

-- Função para marcar mensagens como lidas
CREATE OR REPLACE FUNCTION public.mark_conversation_as_read(
  conversation_id_param uuid,
  is_admin_param boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Verificar se o usuário tem acesso à conversa
  IF is_admin_param AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can mark admin messages as read';
  END IF;
  
  IF NOT is_admin_param THEN
    PERFORM 1 FROM public.support_conversations 
    WHERE id = conversation_id_param 
    AND user_id = auth.uid() 
    AND account_id = get_current_account_id();
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Unauthorized: Cannot access this conversation';
    END IF;
  END IF;
  
  -- Atualizar contadores
  UPDATE public.support_conversations
  SET 
    unread_admin_count = CASE 
      WHEN is_admin_param THEN 0 
      ELSE unread_admin_count 
    END,
    unread_user_count = CASE 
      WHEN NOT is_admin_param THEN 0 
      ELSE unread_user_count 
    END,
    updated_at = now()
  WHERE id = conversation_id_param;
  
  -- Marcar mensagens como lidas
  UPDATE public.support_messages
  SET read_at = now()
  WHERE conversation_id = conversation_id_param
    AND read_at IS NULL
    AND is_admin = (NOT is_admin_param);
END;
$function$;

-- Habilitar realtime
ALTER TABLE public.support_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;

-- Adicionar à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;