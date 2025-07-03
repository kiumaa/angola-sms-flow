import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Clock, User } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";

interface SenderIDRequest {
  id: string;
  sender_id: string;
  status: string;
  created_at: string;
  user_id: string;
  profiles: {
    email: string;
    full_name: string;
  };
}

const AdminSenderIDs = () => {
  const [requests, setRequests] = useState<SenderIDRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('sender_ids')
        .select(`
          id,
          sender_id,
          status,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get profile data for each request
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('user_id', request.user_id)
            .single();
          
          return {
            ...request,
            profiles: profile || { email: '', full_name: '' }
          };
        })
      );

      setRequests(requestsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching sender ID requests:', error);
      toast({
        title: "Erro ao carregar solicitações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('sender_ids')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: status === 'approved' ? "Sender ID aprovado" : "Sender ID rejeitado",
        description: "Status atualizado com sucesso",
      });

      fetchRequests();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando solicitações...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Sender IDs</h1>
          <p className="text-muted-foreground mt-2">
            Aprovar ou rejeitar solicitações de Sender IDs personalizados
          </p>
        </div>

        <div className="grid gap-6">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma solicitação de Sender ID encontrada
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        <span>{request.sender_id}</span>
                      </CardTitle>
                      <CardDescription>
                        Solicitado por {request.profiles.full_name || request.profiles.email}
                      </CardDescription>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Email:</span>
                        <p className="text-muted-foreground">{request.profiles.email}</p>
                      </div>
                      <div>
                        <span className="font-medium">Data da solicitação:</span>
                        <p className="text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="flex space-x-2 pt-4">
                        <Button
                          onClick={() => updateStatus(request.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          onClick={() => updateStatus(request.id, 'rejected')}
                          variant="destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Check className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900">Critérios de aprovação</h3>
                <p className="text-blue-700 text-sm mt-1">
                  • Sender ID deve ser relacionado ao negócio do cliente<br/>
                  • Máximo 11 caracteres alfanuméricos<br/>
                  • Não pode ser genérico (ex: SMS, TEST, etc.)<br/>
                  • Cliente deve ter histórico de uso responsável
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSenderIDs;