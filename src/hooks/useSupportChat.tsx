import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export interface SupportConversation {
  id: string;
  user_id: string;
  account_id: string;
  admin_id?: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'technical' | 'billing' | 'feature_request';
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  unread_admin_count: number;
  unread_user_count: number;
  profiles?: {
    full_name?: string;
    email?: string;
  };
  admin_profile?: {
    full_name?: string;
    email?: string;
  };
}

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  is_admin: boolean;
  attachment_url?: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  created_at: string;
  updated_at: string;
  read_at?: string;
  sender_profile?: {
    full_name?: string;
    email?: string;
  };
}

export const useSupportChat = () => {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  // Buscar conversas
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Buscar conversas básicas primeiro
      let query = supabase
        .from('support_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      // Se não for admin, filtrar apenas conversas próprias
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data: conversations, error } = await query;

      if (error) throw error;

      // Buscar perfis separadamente para evitar problemas de join
      const conversationsWithProfiles = await Promise.all(
        (conversations || []).map(async (conv) => {
          // Buscar perfil do usuário
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', conv.user_id)
            .single();

          // Buscar perfil do admin se existe
          let adminProfile = null;
          if (conv.admin_id) {
            const { data: admin } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('user_id', conv.admin_id)
              .single();
            adminProfile = admin;
          }

          return {
            ...conv,
            profiles: userProfile,
            admin_profile: adminProfile
          };
        })
      );

      setConversations(conversationsWithProfiles as SupportConversation[]);
    } catch (error: any) {
      console.error('Erro ao buscar conversas:', error);
      toast({
        title: "Erro ao carregar conversas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, toast]);

  // Buscar mensagens de uma conversa
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      // Buscar mensagens básicas primeiro
      const { data: messages, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Buscar perfis separadamente
      const messagesWithProfiles = await Promise.all(
        (messages || []).map(async (msg) => {
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', msg.sender_id)
            .single();

          return {
            ...msg,
            sender_profile: senderProfile
          };
        })
      );

      setMessages(messagesWithProfiles as SupportMessage[]);
      
      // Marcar mensagens como lidas
      await markAsRead(conversationId);
    } catch (error: any) {
      console.error('Erro ao buscar mensagens:', error);
      toast({
        title: "Erro ao carregar mensagens",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Criar nova conversa
  const createConversation = useCallback(async (
    subject: string,
    category: string,
    priority: string,
    initialMessage: string
  ) => {
    if (!user) return null;

    try {
      setSending(true);

      // Obter account_id do usuário
      let { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Se o perfil não existe, criá-lo automaticamente
      if (!profile) {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email,
            credits: 5 // Créditos iniciais
          })
          .select('id')
          .single();

        if (profileError) {
          throw new Error('Erro ao criar perfil do usuário: ' + profileError.message);
        }
        
        profile = newProfile;
      }

      // Criar conversa
      const { data: conversation, error: convError } = await supabase
        .from('support_conversations')
        .insert({
          user_id: user.id,
          account_id: profile.id,
          subject,
          category,
          priority,
          status: 'open'
        })
        .select()
        .single();

      if (convError) throw convError;

      // Criar primeira mensagem
      const { error: msgError } = await supabase
        .from('support_messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          message: initialMessage,
          is_admin: false,
          message_type: 'text'
        });

      if (msgError) throw msgError;

      toast({
        title: "Conversa criada",
        description: "Sua solicitação de suporte foi enviada com sucesso.",
      });

      await fetchConversations();
      return conversation.id;
    } catch (error: any) {
      console.error('Erro ao criar conversa:', error);
      toast({
        title: "Erro ao criar conversa",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setSending(false);
    }
  }, [user, toast, fetchConversations]);

  // Enviar mensagem
  const sendMessage = useCallback(async (
    conversationId: string,
    message: string,
    messageType: string = 'text'
  ) => {
    if (!user) return false;

    try {
      setSending(true);

      const { error } = await supabase
        .from('support_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message,
          is_admin: isAdmin,
          message_type: messageType
        });

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSending(false);
    }
  }, [user, isAdmin, toast]);

  // Atualizar status da conversa
  const updateConversationStatus = useCallback(async (
    conversationId: string,
    status: string,
    adminId?: string
  ) => {
    try {
      const updates: any = { status };
      if (adminId) {
        updates.admin_id = adminId;
      }

      const { error } = await supabase
        .from('support_conversations')
        .update(updates)
        .eq('id', conversationId);

      if (error) throw error;

      await fetchConversations();
      
      toast({
        title: "Status atualizado",
        description: "O status da conversa foi atualizado com sucesso.",
      });
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast, fetchConversations]);

  // Marcar como lida
  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_conversation_as_read', {
        conversation_id_param: conversationId,
        is_admin_param: isAdmin
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao marcar como lida:', error);
    }
  }, [isAdmin]);

  // Configurar realtime
  useEffect(() => {
    if (!user) return;

    const conversationsChannel = supabase
      .channel('support-conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_conversations'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel('support-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Recarregar mensagens se estiver vendo a conversa
            const newMessage = payload.new as SupportMessage;
            setMessages(prev => {
              const exists = prev.find(m => m.conversation_id === newMessage.conversation_id);
              if (exists) {
                fetchMessages(newMessage.conversation_id);
              }
              return prev;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user, fetchConversations, fetchMessages]);

  // Carregar conversas na inicialização
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    messages,
    loading,
    sending,
    fetchConversations,
    fetchMessages,
    createConversation,
    sendMessage,
    updateConversationStatus,
    markAsRead
  };
};