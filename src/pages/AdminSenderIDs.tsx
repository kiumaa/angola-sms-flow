import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Clock, User, Search, Edit, Trash2 } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [processing, setProcessing] = useState(false);
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
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('sender_ids')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: status === 'approved' ? "Sender ID aprovado com sucesso" : "Sender ID rejeitado",
        description: status === 'approved' 
          ? "O Sender ID foi aprovado e está disponível para uso"
          : "O Sender ID foi rejeitado",
      });

      fetchRequests();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const deleteSenderID = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este Sender ID?')) return;
    
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('sender_ids')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sender ID removido",
        description: "Sender ID foi removido com sucesso",
      });

      fetchRequests();
    } catch (error: any) {
      console.error('Error deleting sender ID:', error);
      toast({
        title: "Erro ao remover Sender ID",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
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

  const filteredRequests = requests.filter(request =>
    request.sender_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Solicitações de Sender IDs ({filteredRequests.length})
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por Sender ID, email ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma solicitação de Sender ID encontrada
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sender ID</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          <span className="font-medium">{request.sender_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {request.profiles.full_name || "Sem nome"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.profiles.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(request.created_at).toLocaleDateString('pt-BR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateStatus(request.id, 'approved')}
                                disabled={processing}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateStatus(request.id, 'rejected')}
                                disabled={processing}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Rejeitar
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={processing}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteSenderID(request.id)}
                            disabled={processing}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

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