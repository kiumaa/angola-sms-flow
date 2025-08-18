import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Clock, User, Search, Edit, Trash2, Shield, Building2 } from "lucide-react";

interface SenderIDRequest {
  id: string;
  sender_id: string;
  status: string;
  created_at: string;
  user_id: string;
  account_id: string | null;
  is_default: boolean;
  bulksms_status?: string;
  profiles?: {
    email: string;
    full_name: string;
  };
  is_system_default?: boolean;
}

const AdminSenderIDs = () => {
  const [systemSenderIds, setSystemSenderIds] = useState<SenderIDRequest[]>([]);
  const [userSenderIds, setUserSenderIds] = useState<SenderIDRequest[]>([]);
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
          user_id,
          account_id,
          is_default,
          bulksms_status
        `)
        .order('account_id', { ascending: true, nullsFirst: true }) // Global primeiro
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Separar sender IDs globais dos específicos por usuário
      const globalSenderIds: SenderIDRequest[] = [];
      const userSpecificSenderIds: SenderIDRequest[] = [];

      // Processar dados e buscar perfis quando necessário
      for (const request of data || []) {
        let processedRequest: SenderIDRequest = {
          ...request,
          is_system_default: request.account_id === null && request.sender_id === 'SMSAO'
        };

        if (request.account_id === null) {
          // Sender ID global (SMSAO)
          globalSenderIds.push(processedRequest);
        } else {
          // Sender ID específico do usuário - buscar perfil
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('user_id', request.user_id)
            .single();
          
          processedRequest.profiles = profile || { email: '', full_name: '' };
          userSpecificSenderIds.push(processedRequest);
        }
      }

      setSystemSenderIds(globalSenderIds);
      setUserSenderIds(userSpecificSenderIds);
    } catch (error: any) {
      console.error('Error fetching sender ID requests:', error);
      toast({
        title: "Erro ao carregar Sender IDs",
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

  const deleteSenderID = async (id: string, senderIdValue: string) => {
    // Prevenir remoção do SMSAO global
    const senderToDelete = [...systemSenderIds, ...userSenderIds].find(s => s.id === id);
    if (senderToDelete?.is_system_default) {
      toast({
        title: "Não é possível remover",
        description: "SMSAO é o Sender ID padrão do sistema e não pode ser removido.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja remover o Sender ID "${senderIdValue}"?`)) return;
    
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

  const filteredUserSenderIds = userSenderIds.filter(request =>
    request.sender_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando solicitações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Sender IDs</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie Sender IDs globais do sistema e personalizados por cliente
        </p>
      </div>

      {/* Padrão do Sistema */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <Shield className="h-5 w-5 mr-2" />
            Padrão do Sistema
          </CardTitle>
          <CardDescription className="text-blue-700">
            Sender ID global disponível para todos os usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          {systemSenderIds.length > 0 ? (
            <div className="space-y-4">
              {systemSenderIds.map((sender) => (
                <div key={sender.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg text-blue-900">{sender.sender_id}</span>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          Padrão do Sistema
                        </Badge>
                        {getStatusBadge(sender.status)}
                      </div>
                      <p className="text-sm text-blue-700">
                        Usado automaticamente quando o cliente não tem Sender ID próprio aprovado
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-blue-700">Nenhum Sender ID global configurado</p>
          )}
        </CardContent>
      </Card>

      {/* Personalizados por Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Personalizados por Cliente ({filteredUserSenderIds.length})
          </CardTitle>
          <CardDescription>
            Sender IDs específicos solicitados por clientes
          </CardDescription>
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
          {filteredUserSenderIds.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "Nenhum Sender ID encontrado com os filtros aplicados" : "Nenhuma solicitação de Sender ID personalizado"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUserSenderIds.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        <span className="font-medium">{request.sender_id}</span>
                        {request.is_default && (
                          <Badge variant="outline" className="text-xs">Default</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {request.profiles?.full_name || "Sem nome"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {request.profiles?.email || "Sem email"}
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
                          onClick={() => deleteSenderID(request.id, request.sender_id)}
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
                • Cliente deve ter histórico de uso responsável<br/>
                • SMSAO é reservado como padrão do sistema
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSenderIDs;