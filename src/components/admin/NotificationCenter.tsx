import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle,
  Clock,
  Settings,
  MessageSquare,
  Users,
  DollarSign,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  category: 'system' | 'sms' | 'users' | 'financial' | 'security';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'error': return XCircle;
    case 'warning': return AlertTriangle;
    case 'success': return CheckCircle;
    case 'info': return Info;
    default: return Bell;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'error': return 'text-red-500 bg-red-50 border-red-200';
    case 'warning': return 'text-yellow-500 bg-yellow-50 border-yellow-200';
    case 'success': return 'text-green-500 bg-green-50 border-green-200';
    case 'info': return 'text-blue-500 bg-blue-50 border-blue-200';
    default: return 'text-gray-500 bg-gray-50 border-gray-200';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'system': return Settings;
    case 'sms': return MessageSquare;
    case 'users': return Users;
    case 'financial': return DollarSign;
    case 'security': return Shield;
    default: return Bell;
  }
};

export const NotificationCenter = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAdmin } = useAuth();

  // Load real notifications from system monitoring
  useEffect(() => {
    if (!isAdmin) return;

    const generateNotifications = async () => {
      // Load real notifications from system monitoring
      const realNotifications = await loadSystemNotifications();
      setNotifications(realNotifications);
      setUnreadCount(realNotifications.filter(n => !n.read).length);
    };

    const loadSystemNotifications = async (): Promise<Notification[]> => {
      try {
        // Get real system status and create notifications
        const { data: smsLogs, error } = await supabase
          .from('sms_logs')
          .select('*')
          .eq('status', 'failed')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(5);

        if (error) throw error;

        const notifications: Notification[] = [];

        // Create notification for failed SMS if any
        if (smsLogs && smsLogs.length > 0) {
          notifications.push({
            id: 'failed-sms',
            type: 'error',
            title: 'SMS com Falhas Detectados',
            message: `${smsLogs.length} SMS falharam nas últimas 24h. Verifique configurações do gateway.`,
            timestamp: new Date(),
            read: false,
            category: 'system',
            action: { label: 'Ver Detalhes', url: '/admin/sms-monitoring' }
          });
        }

        return notifications;
      } catch (error) {
        console.error('Error loading notifications:', error);
        return [];
      }
    };

    generateNotifications();

    // Set up real-time listener for new notifications
    const channel = supabase
      .channel('admin_notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'admin_audit_logs' },
        () => generateNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m atrás`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h atrás`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d atrás`;
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowPanel(true)}
        className="rounded-xl hover-lift relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <Dialog open={showPanel} onOpenChange={setShowPanel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-primary" />
              <span>Central de Notificações</span>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} não lidas</Badge>
              )}
            </DialogTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Marcar todas como lidas
              </Button>
            )}
          </DialogHeader>
          
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma notificação no momento</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const NotificationIcon = getNotificationIcon(notification.type);
                  const CategoryIcon = getCategoryIcon(notification.category);
                  
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-sm",
                        !notification.read ? "bg-primary/5 border-primary/20" : "bg-background border-border",
                        "hover:bg-muted/50"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          "p-2 rounded-lg flex-shrink-0",
                          getNotificationColor(notification.type)
                        )}>
                          <NotificationIcon className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{notification.title}</p>
                            <div className="flex items-center space-x-2">
                              <CategoryIcon className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          {notification.action && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(notification.action!.url, '_blank');
                              }}
                            >
                              {notification.action.label}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};