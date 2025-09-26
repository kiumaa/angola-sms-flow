import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Filter,
  BarChart3,
  Headphones,
  TrendingUp,
  Activity
} from "lucide-react";
import { useSupportChat, type SupportConversation } from "@/hooks/useSupportChat";
import { useAuth } from "@/hooks/useAuth";
import NewSupportTicketModal from "@/components/support/NewSupportTicketModal";
import SupportChatWidget from "@/components/support/SupportChatWidget";
import SupportTicketCard from "@/components/support/SupportTicketCard";
import SupportNotifications from "@/components/support/SupportNotifications";

const Support = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  
  const { conversations, loading, fetchConversations } = useSupportChat();
  const { isAdmin } = useAuth();

  const handleNewMessage = () => {
    fetchConversations();
  };

  // Métricas calculadas
  const metrics = useMemo(() => {
    const total = conversations.length;
    const open = conversations.filter(c => c.status === 'open').length;
    const inProgress = conversations.filter(c => c.status === 'in_progress').length;
    const resolved = conversations.filter(c => c.status === 'resolved').length;
    const unread = isAdmin 
      ? conversations.filter(c => c.unread_admin_count > 0).length
      : conversations.filter(c => c.unread_user_count > 0).length;
    
    return { total, open, inProgress, resolved, unread };
  }, [conversations, isAdmin]);

  // Filtros aplicados
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const matchesSearch = 
        conv.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || conv.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || conv.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [conversations, searchTerm, statusFilter, priorityFilter]);

  const handleTicketCreated = (conversationId: string) => {
    setSelectedConversation(conversationId);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Tickets Skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-64 mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SupportNotifications onNewMessage={handleNewMessage} />
      
      {/* Header com gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-8 border border-border/50">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight gradient-text">
              {isAdmin ? "Centro de Suporte" : "Meus Tickets de Suporte"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {isAdmin 
                ? "Gerencie todas as solicitações de suporte dos clientes"
                : "Visualize e gerencie suas solicitações de suporte"
              }
            </p>
          </div>

          {!isAdmin && (
            <Button onClick={() => setShowNewTicketModal(true)} size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="h-5 w-5" />
              Nova Solicitação
            </Button>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-lift border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total de Tickets</p>
                <p className="text-3xl font-bold text-foreground">{metrics.total}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Abertos</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.open}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Em Progresso</p>
                <p className="text-3xl font-bold text-amber-600">{metrics.inProgress}</p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <Activity className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Não Lidas</p>
                <p className="text-3xl font-bold text-red-600">{metrics.unread}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-xl">
                <MessageCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros Avançados */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por assunto, nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-300"
              />
            </div>
            
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-background/50 border-border/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40 bg-background/50 border-border/50">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filtros Ativos */}
          {(statusFilter !== "all" || priorityFilter !== "all" || searchTerm) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  <Search className="h-3 w-3" />
                  "{searchTerm}"
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  <Filter className="h-3 w-3" />
                  Status: {statusFilter}
                </Badge>
              )}
              {priorityFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  <Filter className="h-3 w-3" />
                  Prioridade: {priorityFilter}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Tickets */}
      {filteredConversations.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="text-center py-20">
            <div className="max-w-md mx-auto space-y-6">
              <div className="p-6 bg-muted/30 rounded-full w-fit mx-auto">
                <MessageCircle className="h-16 w-16 text-muted-foreground" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all" 
                    ? "Nenhum resultado encontrado" 
                    : "Nenhuma conversa"
                  }
                </h3>
                <p className="text-muted-foreground text-lg">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                    ? "Tente ajustar os filtros ou refinar sua pesquisa" 
                    : isAdmin 
                      ? "Nenhuma solicitação de suporte no momento"
                      : "Você ainda não tem nenhuma solicitação de suporte"
                  }
                </p>
              </div>
              
              {!isAdmin && !searchTerm && statusFilter === "all" && priorityFilter === "all" && (
                <Button 
                  size="lg"
                  className="mt-6 gap-2 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => setShowNewTicketModal(true)}
                >
                  <Plus className="h-5 w-5" />
                  Criar Primeira Solicitação
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredConversations.length} ticket{filteredConversations.length !== 1 ? 's' : ''} encontrado{filteredConversations.length !== 1 ? 's' : ''}
            </p>
            
            {filteredConversations.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Ordenado por atividade recente
              </div>
            )}
          </div>
          
          <div className="grid gap-4">
            {filteredConversations.map((conversation: SupportConversation, index) => (
              <div
                key={conversation.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <SupportTicketCard
                  conversation={conversation}
                  isAdmin={isAdmin}
                  onClick={() => setSelectedConversation(conversation.id)}
                />
              </div>
            ))}
          </div>
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