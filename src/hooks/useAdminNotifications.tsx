import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AdminNotification {
  id: string;
  admin_id: string;
  title: string;
  message: string;
  target_type: 'all' | 'specific' | 'role';
  target_users?: string[];
  target_role?: 'admin' | 'client';
  priority: 'info' | 'warning' | 'urgent';
  category: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total_recipients: number;
  read_count: number;
  dismissed_count: number;
  active_count: number;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data as AdminNotification[] || []);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar notificações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async (notificationData: Omit<AdminNotification, 'id' | 'admin_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data: notification, error } = await supabase
        .from('admin_notifications')
        .insert({
          ...notificationData,
          admin_id: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Distribute notification to users
      const { data: distributionResult, error: distributionError } = await supabase
        .rpc('distribute_admin_notification', { p_notification_id: notification.id });

      if (distributionError) throw distributionError;

      toast({
        title: "Sucesso",
        description: `Notificação criada e enviada para ${distributionResult} usuários`,
      });

      loadNotifications();
      return { success: true, recipients: distributionResult };
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar notificação",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const getNotificationStats = async (notificationId: string): Promise<NotificationStats | null> => {
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('read_at, dismissed_at')
        .eq('notification_id', notificationId);

      if (error) throw error;

      const stats: NotificationStats = {
        total_recipients: data.length,
        read_count: data.filter(n => n.read_at !== null).length,
        dismissed_count: data.filter(n => n.dismissed_at !== null).length,
        active_count: data.filter(n => n.dismissed_at === null).length,
      };

      return stats;
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      return null;
    }
  };

  const deactivateNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_active: false })
        .eq('id', notificationId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Notificação desativada com sucesso",
      });

      loadNotifications();
      return true;
    } catch (error) {
      console.error('Erro ao desativar notificação:', error);
      toast({
        title: "Erro",
        description: "Erro ao desativar notificação",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  return {
    notifications,
    loading,
    loadNotifications,
    createNotification,
    getNotificationStats,
    deactivateNotification,
  };
}