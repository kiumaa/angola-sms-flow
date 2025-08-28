import { useState } from "react";
import { Bell, Settings, Check, X, CreditCard, Wifi, MessageSquare, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRealtimeNotifications, RealtimeNotification } from "@/hooks/useRealtimeNotifications";

const NotificationCenter = () => {
  const {
    notifications,
    unreadCount,
    settings,
    connected,
    markAsRead,
    markAllAsRead,
    clearAll,
    updateSettings
  } = useRealtimeNotifications();
  
  const [showSettings, setShowSettings] = useState(false);

  const getNotificationIcon = (type: RealtimeNotification['type']) => {
    switch (type) {
      case 'sms_sent':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'low_credits':
        return <CreditCard className="h-4 w-4 text-orange-500" />;
      case 'gateway_down':
        return <Wifi className="h-4 w-4 text-red-500" />;
      case 'delivery_report':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'system_alert':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: RealtimeNotification['type']) => {
    switch (type) {
      case 'sms_sent':
        return 'border-l-blue-500';
      case 'low_credits':
        return 'border-l-orange-500';
      case 'gateway_down':
        return 'border-l-red-500';
      case 'delivery_report':
        return 'border-l-green-500';
      case 'system_alert':
        return 'border-l-yellow-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-80 p-0"
          sideOffset={8}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <h3 className="font-semibold">Notificações</h3>
              {!connected && (
                <div className="w-2 h-2 rounded-full bg-red-500" title="Desconectado" />
              )}
              {connected && (
                <div className="w-2 h-2 rounded-full bg-green-500" title="Conectado" />
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Configurações de Notificação</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sms-updates" className="text-sm">
                        Atualizações de SMS
                      </Label>
                      <Switch
                        id="sms-updates"
                        checked={settings.sms_updates}
                        onCheckedChange={(checked) => 
                          updateSettings({ sms_updates: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="credit-alerts" className="text-sm">
                        Alertas de Crédito
                      </Label>
                      <Switch
                        id="credit-alerts"
                        checked={settings.credit_alerts}
                        onCheckedChange={(checked) => 
                          updateSettings({ credit_alerts: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="delivery-reports" className="text-sm">
                        Relatórios de Entrega
                      </Label>
                      <Switch
                        id="delivery-reports"
                        checked={settings.delivery_reports}
                        onCheckedChange={(checked) => 
                          updateSettings({ delivery_reports: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="gateway-status" className="text-sm">
                        Status dos Gateways
                      </Label>
                      <Switch
                        id="gateway-status"
                        checked={settings.gateway_status}
                        onCheckedChange={(checked) => 
                          updateSettings({ gateway_status: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications" className="text-sm">
                        Notificações por Email
                      </Label>
                      <Switch
                        id="email-notifications"
                        checked={settings.email_notifications}
                        onCheckedChange={(checked) => 
                          updateSettings({ email_notifications: checked })
                        }
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={markAllAsRead}
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              
              {notifications.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearAll}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea className="h-96">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma notificação ainda
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors border-l-4 ${
                      getNotificationColor(notification.type)
                    } ${
                      notification.read 
                        ? 'bg-muted/30 hover:bg-muted/50' 
                        : 'bg-background hover:bg-muted/30 shadow-sm'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            notification.read ? 'text-muted-foreground' : 'text-foreground'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        <p className={`text-xs mt-1 ${
                          notification.read ? 'text-muted-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.message}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {!connected && (
            <>
              <DropdownMenuSeparator />
              <div className="p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground text-center">
                  Reconectando... verifique sua conexão
                </p>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default NotificationCenter;