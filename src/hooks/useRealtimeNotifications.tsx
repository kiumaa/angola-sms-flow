import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface RealtimeNotification {
  id: string;
  type: 'campaign_completed' | 'campaign_failed' | 'low_credits' | 'gateway_down' | 'delivery_report';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

interface NotificationSettings {
  campaign_updates: boolean;
  credit_alerts: boolean;
  delivery_reports: boolean;
  gateway_status: boolean;
  email_notifications: boolean;
}

export const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings>({
    campaign_updates: true,
    credit_alerts: true,
    delivery_reports: false,
    gateway_status: true,
    email_notifications: false
  });
  const [connected, setConnected] = useState(false);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  // Generate local notifications based on realtime events
  const createNotification = useCallback((type: string, data: any): RealtimeNotification => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let title = '';
    let message = '';

    switch (type) {
      case 'campaign_completed':
        title = 'Campanha Concluída';
        message = `A campanha "${data.campaign_name}" foi finalizada com sucesso.`;
        break;
      case 'campaign_failed':
        title = 'Campanha Falhou';
        message = `A campanha "${data.campaign_name}" falhou durante o envio.`;
        break;
      case 'low_credits':
        title = 'Créditos Baixos';
        message = `Você possui apenas ${data.credits} créditos restantes.`;
        break;
      case 'gateway_down':
        title = 'Gateway Indisponível';
        message = `O gateway ${data.gateway_name} está fora do ar.`;
        break;
      case 'delivery_report':
        title = 'Relatório de Entrega';
        message = `${data.delivered} mensagens entregues, ${data.failed} falharam.`;
        break;
      default:
        title = 'Notificação';
        message = 'Nova atividade no sistema.';
    }

    return {
      id,
      type: type as any,
      title,
      message,
      data,
      read: false,
      created_at: new Date().toISOString()
    };
  }, []);

  const addNotification = useCallback((notification: RealtimeNotification) => {
    setNotifications(prev => {
      // Avoid duplicates
      if (prev.some(n => n.id === notification.id)) {
        return prev;
      }
      
      // Keep only last 50 notifications
      const updated = [notification, ...prev].slice(0, 50);
      
      // Show toast for new notifications
      if (settings.campaign_updates || isAdmin) {
        toast({
          title: notification.title,
          description: notification.message,
          duration: 5000,
        });
      }
      
      return updated;
    });

    setUnreadCount(prev => prev + 1);
  }, [settings.campaign_updates, isAdmin, toast]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    try {
      setSettings(prev => ({ ...prev, ...newSettings }));
      
      // Save to localStorage for now (could be moved to a user_preferences table later)
      localStorage.setItem('notification_settings', JSON.stringify({ ...settings, ...newSettings }));
      
      toast({
        title: "Configurações Salvas",
        description: "Suas preferências de notificação foram atualizadas.",
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações.",
        variant: "destructive"
      });
    }
  }, [settings, toast]);

  // Load notification settings from localStorage
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      try {
        // Load from localStorage for now
        const savedSettings = localStorage.getItem('notification_settings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };

    loadSettings();
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime notifications...');
    setConnected(true);

    // Campaign updates subscription
    const campaignChannel = supabase
      .channel('campaign-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaigns',
          filter: isAdmin ? undefined : `account_id=eq.${user.id}`
        },
        (payload) => {
          const { old: oldRecord, new: newRecord } = payload;
          
          // Campaign completed
          if (oldRecord.status !== 'completed' && newRecord.status === 'completed') {
            const notification = createNotification('campaign_completed', {
              campaign_name: newRecord.name,
              campaign_id: newRecord.id
            });
            addNotification(notification);
          }
          
          // Campaign failed
          if (oldRecord.status !== 'failed' && newRecord.status === 'failed') {
            const notification = createNotification('campaign_failed', {
              campaign_name: newRecord.name,
              campaign_id: newRecord.id
            });
            addNotification(notification);
          }
        }
      )
      .subscribe((status) => {
        console.log('Campaign notifications status:', status);
      });

    // Credit updates subscription
    const creditChannel = supabase
      .channel('credit-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const { old: oldRecord, new: newRecord } = payload;
          
          // Low credits warning (below 100)
          if (newRecord.credits <= 100 && oldRecord.credits > 100) {
            const notification = createNotification('low_credits', {
              credits: newRecord.credits
            });
            addNotification(notification);
          }
        }
      )
      .subscribe((status) => {
        console.log('Credit notifications status:', status);
      });

    // Gateway status subscription (admin only)
    let gatewayChannel: any = null;
    if (isAdmin) {
      gatewayChannel = supabase
        .channel('gateway-notifications')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'sms_gateways'
          },
          (payload) => {
            const { old: oldRecord, new: newRecord } = payload;
            
            // Gateway went offline
            if (oldRecord.is_active && !newRecord.is_active) {
              const notification = createNotification('gateway_down', {
                gateway_name: newRecord.display_name
              });
              addNotification(notification);
            }
          }
        )
        .subscribe((status) => {
          console.log('Gateway notifications status:', status);
        });
    }

    // Campaign stats subscription for delivery reports
    const statsChannel = supabase
      .channel('stats-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaign_stats'
        },
        (payload) => {
          if (!settings.delivery_reports) return;
          
          const stats = payload.new;
          const total = stats.sent + stats.delivered + stats.failed;
          
          // Report when campaign reaches significant milestones
          if (total > 0 && (total % 1000 === 0 || stats.delivered + stats.failed >= stats.sent)) {
            const notification = createNotification('delivery_report', {
              delivered: stats.delivered,
              failed: stats.failed,
              total: total
            });
            addNotification(notification);
          }
        }
      )
      .subscribe((status) => {
        console.log('Stats notifications status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscriptions...');
      setConnected(false);
      supabase.removeChannel(campaignChannel);
      supabase.removeChannel(creditChannel);
      supabase.removeChannel(statsChannel);
      if (gatewayChannel) {
        supabase.removeChannel(gatewayChannel);
      }
    };
  }, [user, isAdmin, settings.delivery_reports, createNotification, addNotification]);

  return {
    notifications,
    unreadCount,
    settings,
    connected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    updateSettings
  };
};
