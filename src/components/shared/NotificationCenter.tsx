import { useState, useEffect, useMemo } from "react";
import { RealtimeNotification, useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Bell, 
  BellRing, 
  Check, 
  CheckCheck, 
  Settings, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  CreditCard,
  Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    settings,
    connected,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    updateSettings
  } = useRealtimeNotifications();
  
  const [showSettings, setShowSettings] = useState(false);

  const getNotificationIcon = (type: RealtimeNotification['type']) => {
    switch (type) {
      case 'campaign_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'campaign_failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'low_credits':
        return <CreditCard className="h-4 w-4 text-yellow-500" />;
      case 'gateway_down':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'delivery_report':
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: RealtimeNotification['type']) => {
    switch (type) {
      case 'campaign_completed':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
      case 'campaign_failed':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'low_credits':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'gateway_down':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'delivery_report':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [notifications]);

  const unreadNotifications = useMemo(() => {
    return sortedNotifications.filter(n => !n.read);
  }, [sortedNotifications]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-lg">Notificações</CardTitle>
                <div className="flex items-center space-x-1">
                  <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-muted-foreground">
                    {connected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="h-8 w-8 p-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="h-8 w-8 p-0"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                )}
                
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearNotifications}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Settings Panel */}
          {showSettings && (
            <>
              <Separator />
              <CardContent className="py-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Configurações de Notificação</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Atualizações de Campanha</label>
                      <Switch
                        checked={settings.campaign_updates}
                        onCheckedChange={(checked) => 
                          updateSettings({ campaign_updates: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Alertas de Crédito</label>
                      <Switch
                        checked={settings.credit_alerts}
                        onCheckedChange={(checked) => 
                          updateSettings({ credit_alerts: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Relatórios de Entrega</label>
                      <Switch
                        checked={settings.delivery_reports}
                        onCheckedChange={(checked) => 
                          updateSettings({ delivery_reports: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Status de Gateways</label>
                      <Switch
                        checked={settings.gateway_status}
                        onCheckedChange={(checked) => 
                          updateSettings({ gateway_status: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <Separator />
            </>
          )}

          {/* Notifications List */}
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {sortedNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma notificação
                  </p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {unreadCount > 0 && (
                    <>
                      <div className="text-xs font-medium text-muted-foreground px-3 py-2">
                        Não Lidas ({unreadCount})
                      </div>
                      {unreadNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={markAsRead}
                        />
                      ))}
                      
                      {sortedNotifications.filter(n => n.read).length > 0 && (
                        <Separator className="my-2" />
                      )}
                    </>
                  )}
                  
                  {sortedNotifications.filter(n => n.read).length > 0 && (
                    <div className="text-xs font-medium text-muted-foreground px-3 py-2">
                      Anteriores
                    </div>
                  )}
                  
                  {sortedNotifications
                    .filter(n => n.read)
                    .map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                      />
                    ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

interface NotificationItemProps {
  notification: RealtimeNotification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem = ({ notification, onMarkAsRead }: NotificationItemProps) => {
  return (
    <div
      className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-sm ${
        notification.read 
          ? 'opacity-70 bg-muted/30' 
          : getNotificationColor(notification.type)
      }`}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{notification.title}</p>
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </p>
          
          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: ptBR
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

function getNotificationIcon(type: RealtimeNotification['type']) {
  switch (type) {
    case 'campaign_completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'campaign_failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'low_credits':
      return <CreditCard className="h-4 w-4 text-yellow-500" />;
    case 'gateway_down':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'delivery_report':
      return <Activity className="h-4 w-4 text-blue-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

function getNotificationColor(type: RealtimeNotification['type']) {
  switch (type) {
    case 'campaign_completed':
      return 'border-l-green-500 bg-green-50 dark:bg-green-900/20';
    case 'campaign_failed':
      return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
    case 'low_credits':
      return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    case 'gateway_down':
      return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
    case 'delivery_report':
      return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
    default:
      return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/20';
  }
}

export default NotificationCenter;