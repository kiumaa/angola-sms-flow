import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Search, 
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  UserCheck
} from "lucide-react";
import { useSupportChat } from "@/hooks/useSupportChat";
import { useAuth } from "@/hooks/useAuth";
import SupportTicketCard from "@/components/support/SupportTicketCard";
import SupportChatWidget from "@/components/support/SupportChatWidget";
import SupportNotifications from "@/components/support/SupportNotifications";

const AdminSupport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { conversations, loading, fetchConversations, updateConversationStatus } = useSupportChat();
  const { user } = useAuth();

  const handleNewMessage = () => {
    fetchConversations();
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || conv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStats = () => {
    const total = conversations.length;
    const open = conversations.filter(c => c.status === 'open').length;
    const inProgress = conversations.filter(c => c.status === 'in_progress').length;
    const unread = conversations.filter(c => c.unread_admin_count > 0).length;
    
    return { total, open, inProgress, unread };
  };

  const stats = getStats();

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
      <SupportNotifications onNewMessage={handleNewMessage} />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Centro de Suporte Admin</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie todas as solicitações de suporte dos clientes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tickets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abertos</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Lidos</CardTitle>
            <MessageCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-muted/30 p-4 rounded-lg">
        <div className="flex items-center space-x-3 flex-1">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por assunto, nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-background border-none shadow-sm"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Status:</span>
          <div className="flex space-x-2">
            {[
              { value: "all", label: "Todos" },
              { value: "open", label: "Aberto" },
              { value: "in_progress", label: "Em Andamento" },
              { value: "resolved", label: "Resolvido" }
            ].map(status => (
              <Button
                key={status.value}
                variant={statusFilter === status.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status.value)}
              >
                {status.label}
              </Button>
            ))}
          </div>
        </div>
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
                : "Nenhuma solicitação de suporte no momento"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredConversations.map((conversation) => (
            <SupportTicketCard
              key={conversation.id}
              conversation={conversation}
              isAdmin={true}
              onClick={() => setSelectedConversation(conversation.id)}
            />
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