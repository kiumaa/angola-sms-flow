import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  User,
  Headphones,
  Calendar
} from "lucide-react";
import { useSupportChat, type SupportConversation } from "@/hooks/useSupportChat";
import { useAuth } from "@/hooks/useAuth";
import NewSupportTicketModal from "@/components/support/NewSupportTicketModal";
import SupportChatWidget from "@/components/support/SupportChatWidget";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Support = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  
  const { conversations, loading } = useSupportChat();
  const { isAdmin } = useAuth();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: "bg-blue-100 text-blue-800", icon: Clock, label: "Aberto" },
      in_progress: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle, label: "Em Andamento" },
      resolved: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Resolvido" },
      closed: { color: "bg-gray-100 text-gray-800", icon: XCircle, label: "Fechado" }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: "bg-gray-100 text-gray-800", label: "Baixa" },
      medium: { color: "bg-blue-100 text-blue-800", label: "Média" },
      high: { color: "bg-orange-100 text-orange-800", label: "Alta" },
      urgent: { color: "bg-red-100 text-red-800", label: "Urgente" }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];

    return (
      <Badge className={config.color}>
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

  const filteredConversations = conversations.filter(conv =>
    conv.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTicketCreated = (conversationId: string) => {
    setSelectedConversation(conversationId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isAdmin ? "Centro de Suporte" : "Meus Tickets de Suporte"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isAdmin 
              ? "Gerencie todas as solicitações de suporte dos clientes"
              : "Visualize e gerencie suas solicitações de suporte"
            }
          </p>
        </div>

        {!isAdmin && (
          <Button onClick={() => setShowNewTicketModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Solicitação
          </Button>
        )}
      </div>

      {/* Barra de pesquisa */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por assunto, nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Lista de conversas */}
      {filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "Nenhum resultado encontrado" : "Nenhuma conversa"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? "Tente ajustar sua pesquisa" 
                : isAdmin 
                  ? "Nenhuma solicitação de suporte no momento"
                  : "Você ainda não tem nenhuma solicitação de suporte"
              }
            </p>
            {!isAdmin && !searchTerm && (
              <Button 
                className="mt-4"
                onClick={() => setShowNewTicketModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Solicitação
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredConversations.map((conversation: SupportConversation) => (
            <Card 
              key={conversation.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                conversation.unread_user_count > 0 && !isAdmin ? 'ring-2 ring-blue-200' : ''
              } ${
                conversation.unread_admin_count > 0 && isAdmin ? 'ring-2 ring-orange-200' : ''
              }`}
              onClick={() => setSelectedConversation(conversation.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{conversation.subject}</CardTitle>
                    <CardDescription className="mt-1">
                      {isAdmin ? (
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3" />
                          <span>
                            {conversation.profiles?.full_name || 'Usuário'} 
                            ({conversation.profiles?.email})
                          </span>
                        </div>
                      ) : (
                        conversation.admin_profile?.full_name && (
                          <div className="flex items-center space-x-2">
                            <Headphones className="h-3 w-3" />
                            <span>Atendido por {conversation.admin_profile.full_name}</span>
                          </div>
                        )
                      )}
                    </CardDescription>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    {getStatusBadge(conversation.status)}
                    <div className="flex items-center space-x-2">
                      {getPriorityBadge(conversation.priority)}
                      <Badge variant="outline">
                        {getCategoryLabel(conversation.category)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
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

                  {/* Contador de mensagens não lidas */}
                  {((conversation.unread_user_count > 0 && !isAdmin) || 
                    (conversation.unread_admin_count > 0 && isAdmin)) && (
                    <Badge className="bg-red-500 text-white">
                      {isAdmin ? conversation.unread_admin_count : conversation.unread_user_count} nova(s)
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal para nova solicitação */}
      <NewSupportTicketModal
        open={showNewTicketModal}
        onOpenChange={setShowNewTicketModal}
        onTicketCreated={handleTicketCreated}
      />

      {/* Widget de chat */}
      {selectedConversation && (
        <SupportChatWidget
          conversationId={selectedConversation}
          onClose={() => setSelectedConversation(null)}
        />
      )}
    </div>
  );
};

export default Support;