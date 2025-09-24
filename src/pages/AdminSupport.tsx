import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageCircle, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  User,
  Headphones,
  Calendar,
  Filter,
  UserCheck
} from "lucide-react";
import { useSupportChat, type SupportConversation } from "@/hooks/useSupportChat";
import { useAuth } from "@/hooks/useAuth";
import SupportChatWidget from "@/components/support/SupportChatWidget";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminSupport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  
  const { conversations, loading, updateConversationStatus } = useSupportChat();
  const { user } = useAuth();

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

  const handleStatusChange = async (conversationId: string, newStatus: string) => {
    const adminId = newStatus === 'in_progress' ? user?.id : undefined;
    await updateConversationStatus(conversationId, newStatus, adminId);
  };

  const handleTakeTicket = async (conversationId: string) => {
    await updateConversationStatus(conversationId, 'in_progress', user?.id);
  };

  // Filtrar conversas
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      conv.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || conv.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Estatísticas
  const stats = {
    total: conversations.length,
    open: conversations.filter(c => c.status === 'open').length,
    inProgress: conversations.filter(c => c.status === 'in_progress').length,
    unreadCount: conversations.reduce((acc, c) => acc + c.unread_admin_count, 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando tickets de suporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Centro de Suporte</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie todas as solicitações de suporte dos clientes
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-orange-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Abertos</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageCircle className="h-4 w-4 text-red-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Não Lidas</p>
                <p className="text-2xl font-bold">{stats.unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por assunto, nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="open">Aberto</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
                <SelectItem value="closed">Fechado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de tickets */}
      {filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                ? "Nenhum resultado encontrado" 
                : "Nenhum ticket de suporte"
              }
            </h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? "Tente ajustar seus filtros de pesquisa"
                : "Não há tickets de suporte no momento"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredConversations.map((conversation: SupportConversation) => (
            <Card 
              key={conversation.id} 
              className={`transition-all hover:shadow-md ${
                conversation.unread_admin_count > 0 ? 'ring-2 ring-orange-200' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center">
                      {conversation.subject}
                      {conversation.unread_admin_count > 0 && (
                        <Badge className="ml-2 bg-red-500 text-white">
                          {conversation.unread_admin_count} nova(s)
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3" />
                          <span>
                            {conversation.profiles?.full_name || 'Usuário'} 
                            ({conversation.profiles?.email})
                          </span>
                        </div>
                        {conversation.admin_profile?.full_name && (
                          <div className="flex items-center space-x-2">
                            <Headphones className="h-3 w-3" />
                            <span>Atendido por {conversation.admin_profile.full_name}</span>
                          </div>
                        )}
                      </div>
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

                  <div className="flex items-center space-x-2">
                    {conversation.status === 'open' && !conversation.admin_id && (
                      <Button
                        size="sm"
                        onClick={() => handleTakeTicket(conversation.id)}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Assumir
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Responder
                    </Button>

                    <Select
                      value={conversation.status}
                      onValueChange={(value) => handleStatusChange(conversation.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Aberto</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="resolved">Resolvido</SelectItem>
                        <SelectItem value="closed">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

export default AdminSupport;