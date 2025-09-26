import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Clock
} from "lucide-react";
import { useSupportChat, type SupportConversation } from "@/hooks/useSupportChat";
import { useAuth } from "@/hooks/useAuth";
import NewSupportTicketModal from "@/components/support/NewSupportTicketModal";
import SupportChatWidget from "@/components/support/SupportChatWidget";
import SupportTicketCard from "@/components/support/SupportTicketCard";
import SupportNotifications from "@/components/support/SupportNotifications";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Support = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  
  const { conversations, loading, fetchConversations } = useSupportChat();
  const { isAdmin } = useAuth();

  const handleNewMessage = () => {
    fetchConversations();
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
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando conversas...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <SupportNotifications onNewMessage={handleNewMessage} />
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
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
            <Button onClick={() => setShowNewTicketModal(true)} size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Solicitação
            </Button>
          )}
        </div>

        {/* Barra de pesquisa */}
        <div className="flex items-center space-x-3 bg-muted/30 p-4 rounded-lg">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por assunto, nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-background border-none shadow-sm"
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
              <SupportTicketCard
                key={conversation.id}
                conversation={conversation}
                isAdmin={isAdmin}
                onClick={() => setSelectedConversation(conversation.id)}
              />
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
    </DashboardLayout>
  );
};

export default Support;