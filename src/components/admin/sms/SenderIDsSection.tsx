
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  XCircle,
  FileText,
  Upload
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SenderID {
  id: string;
  sender_id: string;
  user_id: string;
  status: string;
  bulksms_status: string;
  bulkgate_status: string;
  supported_gateways: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export default function SenderIDsSection() {
  const [senderIDs, setSenderIDs] = useState<SenderID[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSenderID, setNewSenderID] = useState({
    sender_id: '',
    gateways: ['bulksms'] as string[]
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSenderIDs();
  }, []);

  const loadSenderIDs = async () => {
    try {
      const { data, error } = await supabase
        .from('sender_ids')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSenderIDs(data || []);
    } catch (error) {
      console.error('Erro ao carregar Sender IDs:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar Sender IDs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createSenderID = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('sender_ids')
        .insert({
          sender_id: newSenderID.sender_id,
          user_id: user.id,
          supported_gateways: newSenderID.gateways,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Sender ID Criado",
        description: "Novo Sender ID foi solicitado com sucesso"
      });

      setShowNewModal(false);
      setNewSenderID({ sender_id: '', gateways: ['bulksms'] });
      loadSenderIDs();
    } catch (error: any) {
      console.error('Erro ao criar Sender ID:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getGatewayStatus = (senderID: SenderID, gateway: string) => {
    if (gateway === 'bulksms') {
      return getStatusBadge(senderID.bulksms_status);
    } else if (gateway === 'bulkgate') {
      return getStatusBadge(senderID.bulkgate_status);
    }
    return <Badge variant="outline">N/A</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando Sender IDs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de adicionar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Sender IDs</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie os remetentes aprovados para envio de SMS
              </p>
            </div>
            
            <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Sender ID
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Solicitar Novo Sender ID</DialogTitle>
                  <DialogDescription>
                    Solicite a aprovação de um novo remetente para seus SMS
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sender-id">Nome do Remetente</Label>
                    <Input
                      id="sender-id"
                      value={newSenderID.sender_id}
                      onChange={(e) => setNewSenderID(prev => ({ ...prev, sender_id: e.target.value }))}
                      placeholder="Ex: MinhaEmpresa"
                      maxLength={11}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Máximo 11 caracteres, sem espaços ou símbolos especiais
                    </p>
                  </div>

                  <div>
                    <Label>Gateways Suportados</Label>
                    <div className="mt-2 space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newSenderID.gateways.includes('bulksms')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewSenderID(prev => ({ 
                                ...prev, 
                                gateways: [...prev.gateways, 'bulksms']
                              }));
                            } else {
                              setNewSenderID(prev => ({ 
                                ...prev, 
                                gateways: prev.gateways.filter(g => g !== 'bulksms')
                              }));
                            }
                          }}
                        />
                        <span className="text-sm">BulkSMS</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newSenderID.gateways.includes('bulkgate')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewSenderID(prev => ({ 
                                ...prev, 
                                gateways: [...prev.gateways, 'bulkgate']
                              }));
                            } else {
                              setNewSenderID(prev => ({ 
                                ...prev, 
                                gateways: prev.gateways.filter(g => g !== 'bulkgate')
                              }));
                            }
                          }}
                        />
                        <span className="text-sm">BulkGate</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewModal(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={createSenderID}
                      disabled={!newSenderID.sender_id || newSenderID.gateways.length === 0}
                    >
                      Solicitar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Tabela de Sender IDs */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Remetente</TableHead>
                <TableHead>Status Geral</TableHead>
                <TableHead>BulkSMS</TableHead>
                <TableHead>BulkGate</TableHead>
                <TableHead>Padrão</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {senderIDs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">Nenhum Sender ID encontrado</p>
                      <p className="text-sm text-muted-foreground">Clique em "Novo Sender ID" para começar</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                senderIDs.map((senderID) => (
                  <TableRow key={senderID.id}>
                    <TableCell className="font-medium">
                      {senderID.sender_id}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(senderID.status)}
                    </TableCell>
                    <TableCell>
                      {senderID.supported_gateways.includes('bulksms') ? 
                        getGatewayStatus(senderID, 'bulksms') : 
                        <Badge variant="outline">N/A</Badge>
                      }
                    </TableCell>
                    <TableCell>
                      {senderID.supported_gateways.includes('bulkgate') ? 
                        getGatewayStatus(senderID, 'bulkgate') : 
                        <Badge variant="outline">N/A</Badge>
                      }
                    </TableCell>
                    <TableCell>
                      {senderID.is_default ? (
                        <Badge variant="default">Sim</Badge>
                      ) : (
                        <Badge variant="outline">Não</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(senderID.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Informações importantes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Sender IDs devem ter no máximo 11 caracteres alfanuméricos</p>
            <p>• A aprovação pode levar até 24-48 horas dependendo do gateway</p>
            <p>• Alguns gateways podem exigir documentação adicional</p>
            <p>• Sender IDs aprovados podem ser usados para campanhas SMS</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
