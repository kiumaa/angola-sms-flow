import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Clock, User, Search, Eye, CreditCard } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAuth } from "@/hooks/useAuth";

interface CreditRequest {
  id: string;
  amount_kwanza: number;
  credits_requested: number;
  status: string;
  requested_at: string;
  payment_reference: string;
  user_id: string;
  profiles: {
    email: string;
    full_name: string;
    company_name: string;
  };
  credit_packages: {
    name: string;
    description: string;
  } | null;
}

const AdminCreditRequests = () => {
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processing, setProcessing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CreditRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_requests')
        .select(`
          *,
          credit_packages (
            name,
            description
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) throw error;

      // Get profile data for each request
      const requestsWithProfiles = await Promise.all(
        (data || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name, company_name')
            .eq('user_id', request.user_id)
            .single();
          
          return {
            ...request,
            profiles: profile || { email: '', full_name: '', company_name: '' }
          };
        })
      );

      setRequests(requestsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching credit requests:', error);
      toast({
        title: "Erro ao carregar solicitações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId: string) => {
    if (!user) return;
    
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('approve_credit_request', {
        request_id: requestId,
        admin_user_id: user.id
      });

      if (error) throw error;

      toast({
        title: "Solicitação aprovada!",
        description: "Créditos foram adicionados à conta do cliente.",
      });

      fetchRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast({
        title: "Erro ao aprovar solicitação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const rejectRequest = async (requestId: string) => {
    if (!user) return;
    
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('reject_credit_request', {
        request_id: requestId,
        admin_user_id: user.id,
        notes: adminNotes
      });

      if (error) throw error;

      toast({
        title: "Solicitação rejeitada",
        description: "Cliente foi notificado sobre a rejeição.",
      });

      setAdminNotes("");
      fetchRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Erro ao rejeitar solicitação",
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
    request.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.profiles.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.profiles.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold">Solicitações de Créditos</h1>
          <p className="text-muted-foreground mt-2">
            Aprovar ou rejeitar solicitações de compra de créditos SMS
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Solicitações de Créditos ({filteredRequests.length})
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por cliente, email ou referência..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma solicitação de créditos encontrada
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Créditos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {request.profiles.company_name || request.profiles.full_name || "Sem nome"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.profiles.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {request.amount_kwanza.toLocaleString()} Kz
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {request.credits_requested} SMS
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(request.status)}
                          {getStatusBadge(request.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(request.requested_at).toLocaleDateString('pt-BR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedRequest(request)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Detalhes da Solicitação</DialogTitle>
                                <DialogDescription>
                                  Informações completas da solicitação de créditos
                                </DialogDescription>
                              </DialogHeader>
                              {selectedRequest && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Cliente</label>
                                      <p>{selectedRequest.profiles.company_name || selectedRequest.profiles.full_name}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Email</label>
                                      <p>{selectedRequest.profiles.email}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Valor</label>
                                      <p>{selectedRequest.amount_kwanza.toLocaleString()} Kz</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Créditos</label>
                                      <p>{selectedRequest.credits_requested} SMS</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Referência</label>
                                      <p>{selectedRequest.payment_reference}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Pacote</label>
                                      <p>{selectedRequest.credit_packages?.name || "Personalizado"}</p>
                                    </div>
                                  </div>
                                  
                                  {selectedRequest.status === 'pending' && (
                                    <div className="space-y-4 border-t pt-4">
                                      <Textarea
                                        placeholder="Notas administrativas (opcional)"
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                      />
                                      <div className="flex space-x-2">
                                        <Button
                                          onClick={() => approveRequest(selectedRequest.id)}
                                          disabled={processing}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          <Check className="h-4 w-4 mr-1" />
                                          Aprovar
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          onClick={() => rejectRequest(selectedRequest.id)}
                                          disabled={processing}
                                        >
                                          <X className="h-4 w-4 mr-1" />
                                          Rejeitar
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => approveRequest(request.id)}
                                disabled={processing}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectRequest(request.id)}
                                disabled={processing}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminCreditRequests;