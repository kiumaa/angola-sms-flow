import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";

interface SupportNotificationsProps {
  onNewMessage?: (conversationId: string) => void;
}

const SupportNotifications: React.FC<SupportNotificationsProps> = ({ onNewMessage }) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Canal para notificações de mensagens
    const messagesChannel = supabase
      .channel('support-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages'
        },
        async (payload) => {
          const newMessage = payload.new;
          
          // Verificar se a mensagem é para o usuário atual
          const { data: conversation } = await supabase
            .from('support_conversations')
            .select('user_id, admin_id, subject')
            .eq('id', newMessage.conversation_id)
            .single();

          if (!conversation) return;

          // Mostrar notificação apenas se:
          // - Não é admin e recebeu mensagem do admin
          // - É admin e recebeu mensagem do usuário
          const shouldNotify = (!isAdmin && newMessage.is_admin && conversation.user_id === user.id) ||
                              (isAdmin && !newMessage.is_admin && conversation.admin_id === user.id);

          if (shouldNotify && newMessage.sender_id !== user.id) {
            // Buscar nome do remetente
            const { data: senderProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', newMessage.sender_id)
              .single();

            toast({
              title: "Nova mensagem de suporte",
              description: `${senderProfile?.full_name || 'Usuário'}: ${newMessage.message.substring(0, 50)}${newMessage.message.length > 50 ? '...' : ''}`,
              action: (
                <MessageCircle className="h-4 w-4" />
              ),
            });

            onNewMessage?.(newMessage.conversation_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user, isAdmin, toast, onNewMessage]);

  return null;
};

export default SupportNotifications;