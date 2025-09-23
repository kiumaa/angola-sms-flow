import React, { useState } from 'react';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Settings, 
  Check, 
  X, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Clock,
  Filter,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  source: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Gateway BulkSMS com alta latência',
    message: 'O gateway BulkSMS está apresentando tempos de resposta elevados (>3s). Considere usar o BulkGate temporariamente.',
    timestamp: '2024-01-21T10:30:00Z',
    read: false,
    source: 'Sistema',
    action: {
      label: 'Alternar Gateway',
      onClick: () => toast.info('Redirecionando para configurações de gateway...')
    }
  },
  {
    id: '2',
    type: 'success',
    title: 'Campanha concluída com sucesso',
    message: 'A campanha "Promoção Janeiro" foi concluída com 98.5% de taxa de entrega (2,450 mensagens enviadas).',
    timestamp: '2024-01-21T09:15:00Z',
    read: false,
    source: 'Campanhas'
  },
  {
    id: '3',
    type: 'info',
    title: 'Novo usuário registrado',
    message: 'João Silva se registrou na plataforma e recebeu 5 créditos gratuitos.',
    timestamp: '2024-01-21T08:45:00Z',
    read: true,
    source: 'Usuários'
  },
  {
    id: '4',
    type: 'error',
    title: 'Falha no envio de SMS',
    message: 'Erro crítico detectado no gateway BulkGate. 45 mensagens falharam na última hora.',
    timestamp: '2024-01-21T07:20:00Z',
    read: false,
    source: 'Sistema',
    action: {
      label: 'Ver Detalhes',
      onClick: () => toast.info('Abrindo logs de erro...')
    }
  },
  {
    id: '5',
    type: 'info',
    title: 'Backup automático concluído',
    message: 'Backup automático dos dados foi concluído com sucesso. Próximo backup: 22/01 às 02:00.',
    timestamp: '2024-01-21T02:00:00Z',
    read: true,
    source: 'Sistema'
  }
];

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'warning' | 'error'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return AlertTriangle;
      case 'error': return XCircle;
      case 'success': return CheckCircle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-orange-600 bg-orange-100 dark:bg-orange-950';
      case 'error': return 'text-red-600 bg-red-100 dark:bg-red-950';
      case 'success': return 'text-green-600 bg-green-100 dark:bg-green-950';
      case 'info': return 'text-blue-600 bg-blue-100 dark:bg-blue-950';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-950';
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      case 'success': return 'default';
      case 'info': return 'outline';
      default: return 'outline';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    toast.success('Todas as notificações foram marcadas como lidas');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('Notificação removida');
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              aria-label={`${unreadCount} novas notificações`}
              className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground"
            >
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[420px] p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Central de Notificações</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-[10px]">
                    {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Alertas e atualizações do sistema</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                  <Filter className="mr-1 h-3 w-3" />
                  Filtrar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilter('all')}>Todas</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('unread')}>Não lidas ({unreadCount})</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilter('error')}>Erros</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('warning')}>Avisos</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 px-2 text-xs">
                <Check className="mr-1 h-3 w-3" />
                Marcar todas
              </Button>
            )}

            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
              <Settings className="mr-1 h-3 w-3" />
              Config
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="max-h-96 overflow-auto p-3 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-10">
              <Bell className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-sm font-medium mb-1">Nenhuma notificação</h3>
              <p className="text-xs text-muted-foreground">
                {filter === 'unread' ? 'Todas as notificações foram lidas' : 'Não há notificações para exibir'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const NotificationIcon = getNotificationIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                    notification.read ? 'bg-muted/30 border-border' : 'bg-background border-primary/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                      <NotificationIcon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <h4 className={`truncate text-sm font-medium ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {notification.title}
                        </h4>
                        <div className="ml-2 flex shrink-0 items-center gap-2">
                          <Badge variant={getBadgeVariant(notification.type)} className="text-[10px]">
                            {notification.type}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {notification.source}
                          </Badge>
                        </div>
                      </div>

                      <p className="mb-2 text-xs text-muted-foreground">{notification.message}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(notification.timestamp)}
                        </div>

                        <div className="flex items-center gap-1">
                          {notification.action && (
                            <Button size="sm" variant="outline" onClick={notification.action.onClick} className="h-7 px-2 text-xs">
                              {notification.action.label}
                            </Button>
                          )}

                          {!notification.read && (
                            <Button size="sm" variant="ghost" onClick={() => markAsRead(notification.id)} className="h-7 px-2 text-xs">
                              <Check className="h-3 w-3" />
                              Marcar como lida
                            </Button>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!notification.read && (
                                <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                  <Check className="h-4 w-4 mr-2" />
                                  Marcar como lida
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => deleteNotification(notification.id)} className="text-destructive">
                                <X className="h-4 w-4 mr-2" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-2 text-center text-[10px] text-muted-foreground">Atualizado agora</div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};