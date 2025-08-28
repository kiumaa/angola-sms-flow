import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface RealtimeNotification {
  id: string;
  type: 'low_credits' | 'gateway_down' | 'delivery_report' | 'sms_sent' | 'system_alert';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
}

interface NotificationSettings {
  credit_alerts: boolean;
  delivery_reports: boolean;
  gateway_status: boolean;
  sms_updates: boolean;
  email_notifications: boolean;
}

export const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<NotificationSettings>({
    credit_alerts: true,
    delivery_reports: false,
    gateway_status: true,
    sms_updates: true,
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
      case 'sms_sent':
        title = 'SMS Enviado';
        message = `SMS enviado com sucesso para ${data.recipient || 'destinatário'}.`;
        break;
      case 'low_credits':
        title = 'Créditos Baixos';
        message = `Você tem apenas ${data.credits || 0} créditos restantes. Considere recarregar sua conta.`;
        break;
      case 'gateway_down':
        title = 'Gateway Offline';
        message = `O gateway ${data.gateway_name} está temporariamente indisponível.`;
        break;
      case 'delivery_report':
        title = 'Relatório de Entrega';
        message = `${data.delivered || 0} de ${data.sent || 0} SMS foram entregues com sucesso.`;
        break;
      case 'system_alert':
        title = 'Alerta do Sistema';
        message = data.message || 'Notificação do sistema.';
        break;
      default:
        title = 'Notificação';
        message = 'Nova notificação recebida.';
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

  // Show notifications based on user settings
  const showNotification = useCallback((notification: RealtimeNotification) => {
    // Check if user wants this type of notification
    const shouldShow = 
      (notification.type === 'low_credits' && settings.credit_alerts) ||
      (notification.type === 'delivery_report' && settings.delivery_reports) ||
      (notification.type === 'gateway_down' && settings.gateway_status) ||
      (notification.type === 'sms_sent' && settings.sms_updates) ||
      isAdmin; // Admins get all notifications

    if (shouldShow) {
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });
    }
  }, [settings.credit_alerts, settings.delivery_reports, settings.gateway_status, settings.sms_updates, isAdmin, toast]);

  // Add notification to list
  const addNotification = useCallback((notification: RealtimeNotification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep max 50 notifications
    setUnreadCount(prev => prev + 1);
    showNotification(notification);
  }, [showNotification]);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    // Could also save to user preferences in database here
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime notifications...');
    let channels: any[] = [];

    try {
      // Credits subscription for low credit alerts
      const creditsChannel = supabase
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
            const newRecord = payload.new as any;
            const oldRecord = payload.old as any;
            
            // Check for low credits (less than 10)
            if (newRecord.credits <= 10 && oldRecord.credits > 10) {
              const notification = createNotification('low_credits', {
                credits: newRecord.credits,
                user_id: user.id
              });
              addNotification(notification);
            }
          }
        )
        .subscribe((status) => {
          console.log('Credit notifications status:', status);
        });

      channels.push(creditsChannel);

      // SMS logs subscription for delivery reports
      const smsChannel = supabase
        .channel('sms-notifications')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'sms_logs',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newRecord = payload.new as any;
            
            if (newRecord.status === 'sent' && settings.sms_updates) {
              const notification = createNotification('sms_sent', {
                recipient: newRecord.phone_number,
                message_id: newRecord.id
              });
              addNotification(notification);
            }
          }
        )
        .subscribe((status) => {
          console.log('SMS notifications status:', status);
        });

      channels.push(smsChannel);

      // Gateway status subscription (admin only)
      if (isAdmin) {
        const gatewayChannel = supabase
          .channel('gateway-notifications')
          .on(
            'postgres_changes',
            { 
              event: 'UPDATE', 
              schema: 'public', 
              table: 'sms_gateways'
            },
            (payload) => {
              const newRecord = payload.new as any;
              const oldRecord = payload.old as any;
              
              // Gateway went offline
              if (newRecord.is_active === false && oldRecord.is_active === true) {
                const notification = createNotification('gateway_down', {
                  gateway_name: newRecord.display_name,
                  gateway_id: newRecord.id
                });
                addNotification(notification);
              }
            }
          )
          .subscribe((status) => {
            console.log('Gateway notifications status:', status);
          });

        channels.push(gatewayChannel);
      }

      setConnected(true);

    } catch (error) {
      console.error('Error setting up notifications:', error);
      setConnected(false);
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up realtime subscriptions...');
      channels.forEach(channel => {
        if (channel) {
          console.log(`${channel.topic} notifications status: CLOSED`);
          supabase.removeChannel(channel);
        }
      });
      setConnected(false);
    };
  }, [user, isAdmin, settings.sms_updates, createNotification, addNotification]);

  return {
    notifications,
    unreadCount,
    settings,
    connected,
    addNotification,
    markAsRead,
    markAllAsRead,
    updateSettings,
    clearAll
  };
};