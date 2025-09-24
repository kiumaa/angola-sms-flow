import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  User,
  Headphones,
  Calendar,
  MessageCircle
} from "lucide-react";
import { SupportConversation } from "@/hooks/useSupportChat";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SupportTicketCardProps {
  conversation: SupportConversation;
  isAdmin: boolean;
  onClick: () => void;
}

const SupportTicketCard: React.FC<SupportTicketCardProps> = ({ 
  conversation, 
  isAdmin, 
  onClick 
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: "bg-blue-500/10 text-blue-700 border-blue-200", icon: Clock, label: "Aberto" },
      in_progress: { color: "bg-amber-500/10 text-amber-700 border-amber-200", icon: AlertCircle, label: "Em Andamento" },
      resolved: { color: "bg-emerald-500/10 text-emerald-700 border-emerald-200", icon: CheckCircle, label: "Resolvido" },
      closed: { color: "bg-gray-500/10 text-gray-700 border-gray-200", icon: XCircle, label: "Fechado" }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={`${config.color} font-medium`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: "bg-slate-500/10 text-slate-700 border-slate-200", label: "Baixa" },
      medium: { color: "bg-blue-500/10 text-blue-700 border-blue-200", label: "Média" },
      high: { color: "bg-orange-500/10 text-orange-700 border-orange-200", label: "Alta" },
      urgent: { color: "bg-red-500/10 text-red-700 border-red-200", label: "Urgente" }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];

    return (
      <Badge variant="outline" className={`${config.color} font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const categories = {
      general: 'Geral',
      technical: 'Técnico',
      billing: 'Faturamento',
      feature_request: 'Funcionalidade'
    };
    return categories[category as keyof typeof categories] || category;
  };

  const hasUnreadMessages = isAdmin 
    ? conversation.unread_admin_count > 0 
    : conversation.unread_user_count > 0;

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group ${
        hasUnreadMessages ? 'ring-2 ring-primary/20 shadow-md' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
              {conversation.subject}
            </CardTitle>
            <CardDescription className="mt-2 flex items-center space-x-2">
              {isAdmin ? (
                <div className="flex items-center space-x-2">
                  <User className="h-3 w-3" />
                  <span className="text-sm">
                    {conversation.profiles?.full_name || 'Usuário'} 
                    <span className="text-muted-foreground ml-1">
                      ({conversation.profiles?.email})
                    </span>
                  </span>
                </div>
              ) : (
                conversation.admin_profile?.full_name && (
                  <div className="flex items-center space-x-2">
                    <Headphones className="h-3 w-3" />
                    <span className="text-sm">
                      Atendido por {conversation.admin_profile.full_name}
                    </span>
                  </div>
                )
              )}
            </CardDescription>
          </div>
          
          <div className="flex flex-col items-end space-y-2 ml-4">
            {getStatusBadge(conversation.status)}
            <div className="flex items-center space-x-2">
              {getPriorityBadge(conversation.priority)}
              <Badge variant="secondary" className="text-xs">
                {getCategoryLabel(conversation.category)}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(conversation.created_at), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>
            </div>
            
            {conversation.last_message_at && (
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-3 w-3" />
                <span>
                  Última: {formatDistanceToNow(new Date(conversation.last_message_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </span>
              </div>
            )}
          </div>

          {hasUnreadMessages && (
            <Badge className="bg-red-500 text-white hover:bg-red-600 animate-pulse">
              <MessageCircle className="h-3 w-3 mr-1" />
              {isAdmin ? conversation.unread_admin_count : conversation.unread_user_count} nova(s)
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupportTicketCard;