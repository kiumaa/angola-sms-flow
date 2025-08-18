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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  XCircle,
  FileText,
  Upload,
  Settings,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
  Save,
  UserCheck,
  UserX,
  Star,
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SenderID {
  id: string;
  sender_id: string;
  user_id: string;
  status: string;
  bulksms_status: string;
  supported_gateways: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export default function SenderIDsSection() {
  const [senderIDs, setSenderIDs] = useState<SenderID[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSenderID, setSelectedSenderID] = useState<SenderID | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [newSenderID, setNewSenderID] = useState({
    sender_id: '',
    gateways: ['bulksms'] as string[],
    user_id: '',
    status: 'pending',
    bulksms_status: 'pending',
    is_default: false,
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSenderIDs();
    loadUsers();
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

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const createSenderID = async () => {
    try {
      const { error } = await supabase
        .from('sender_ids')
        .insert({
          sender_id: newSenderID.sender_id,
          user_id: newSenderID.user_id,
          supported_gateways: newSenderID.gateways,
          status: newSenderID.status,
          bulksms_status: newSenderID.bulksms_status,
          is_default: newSenderID.is_default
        });

      if (error) throw error;

      toast({
        title: "Sender ID Criado",
        description: "Novo Sender ID foi criado com sucesso"
      });

      setShowNewModal(false);
      resetNewSenderID();
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

  const updateSenderID = async () => {
    if (!selectedSenderID) return;

    try {
      const { error } = await supabase
        .from('sender_ids')
        .update({
          sender_id: newSenderID.sender_id,
          status: newSenderID.status,
          bulksms_status: newSenderID.bulksms_status,
          supported_gateways: newSenderID.gateways,
          is_default: newSenderID.is_default
        })
        .eq('id', selectedSenderID.id);

      if (error) throw error;

      toast({
        title: "Sender ID Atualizado",
        description: "Alterações salvas com sucesso"
      });

      setShowEditModal(false);
      setSelectedSenderID(null);
      resetNewSenderID();
      loadSenderIDs();
    } catch (error: any) {
      console.error('Erro ao atualizar Sender ID:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteSenderID = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sender_ids')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sender ID Removido",
        description: "Sender ID foi removido com sucesso"
      });

      loadSenderIDs();
    } catch (error: any) {
      console.error('Erro ao remover Sender ID:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleDefault = async (senderID: SenderID) => {
    try {
      // Se estiver marcando como padrão, desmarcar todos os outros do mesmo usuário
      if (!senderID.is_default) {
        await supabase
          .from('sender_ids')
          .update({ is_default: false })
          .eq('user_id', senderID.user_id);
      }

      const { error } = await supabase
        .from('sender_ids')
        .update({ is_default: !senderID.is_default })
        .eq('id', senderID.id);

      if (error) throw error;

      toast({
        title: senderID.is_default ? "Padrão Removido" : "Padrão Definido",
        description: `Sender ID ${senderID.is_default ? 'não é mais' : 'agora é'} o padrão`
      });

      loadSenderIDs();
    } catch (error: any) {
      console.error('Erro ao alterar padrão:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const quickApprove = async (senderID: SenderID) => {
    try {
      const { error } = await supabase
        .from('sender_ids')
        .update({
          status: 'approved',
          bulksms_status: 'approved'
        })
        .eq('id', senderID.id);

      if (error) throw error;

      toast({
        title: "Sender ID Aprovado",
        description: "Sender ID foi aprovado para BulkSMS"
      });

      loadSenderIDs();
    } catch (error: any) {
      console.error('Erro ao aprovar:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const quickReject = async (senderID: SenderID) => {
    try {
      const { error } = await supabase
        .from('sender_ids')
        .update({
          status: 'rejected',
          bulksms_status: 'rejected'
        })
        .eq('id', senderID.id);

      if (error) throw error;

      toast({
        title: "Sender ID Rejeitado",
        description: "Sender ID foi rejeitado"
      });

      loadSenderIDs();
    } catch (error: any) {
      console.error('Erro ao rejeitar:', error);
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const resetNewSenderID = () => {
    setNewSenderID({
      sender_id: '',
      gateways: ['bulksms'],
      user_id: '',
      status: 'pending',
      bulksms_status: 'pending',
      is_default: false,
      notes: ''
    });
  };

  const openEditModal = (senderID: SenderID) => {
    setSelectedSenderID(senderID);
    setNewSenderID({
      sender_id: senderID.sender_id,
      gateways: senderID.supported_gateways,
      user_id: senderID.user_id,
      status: senderID.status,
      bulksms_status: senderID.bulksms_status,
      is_default: senderID.is_default,
      notes: ''
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (senderID: SenderID) => {
    setSelectedSenderID(senderID);
    setShowDetailsModal(true);
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user ? `${user.full_name} (${user.email})` : userId;
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
    }
    return <Badge variant="outline">N/A</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando Sender IDs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header com controles administrativos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Gestão Completa de Sender IDs</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Controle total sobre todos os remetentes do sistema
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadSenderIDs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              
              <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Sender ID
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Sender ID</DialogTitle>
                    <DialogDescription>
                      Configure um novo remetente com controle total dos status
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sender-id">Nome do Remetente</Label>
                        <Input
                          id="sender-id"
                          value={newSenderID.sender_id}
                          onChange={(e) => setNewSenderID(prev => ({ ...prev, sender_id: e.target.value }))}
                          placeholder="Ex: MinhaEmpresa"
                          maxLength={11}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="user-select">Usuário</Label>
                        <Select value={newSenderID.user_id} onValueChange={(value) => setNewSenderID(prev => ({ ...prev, user_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar usuário" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.user_id} value={user.user_id}>
                                {user.full_name} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Status Geral</Label>
                        <Select value={newSenderID.status} onValueChange={(value) => setNewSenderID(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="approved">Aprovado</SelectItem>
                            <SelectItem value="rejected">Rejeitado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Status BulkSMS</Label>
                        <Select value={newSenderID.bulksms_status} onValueChange={(value) => setNewSenderID(prev => ({ ...prev, bulksms_status: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="approved">Aprovado</SelectItem>
                            <SelectItem value="rejected">Rejeitado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newSenderID.is_default}
                        onCheckedChange={(checked) => setNewSenderID(prev => ({ ...prev, is_default: checked }))}
                      />
                      <Label>Definir como padrão para o usuário</Label>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => { setShowNewModal(false); resetNewSenderID(); }}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={createSenderID}
                        disabled={!newSenderID.sender_id || !newSenderID.user_id}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Criar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabela de Sender IDs com controles avançados */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Remetente</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Status Geral</TableHead>
                <TableHead>BulkSMS</TableHead>
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
                      <div className="flex items-center gap-2">
                        {senderID.sender_id}
                        {senderID.is_default && <Star className="h-3 w-3 text-yellow-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getUserName(senderID.user_id)}
                      </div>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDefault(senderID)}
                        className={senderID.is_default ? "text-yellow-600" : ""}
                      >
                        <Star className={`h-3 w-3 ${senderID.is_default ? 'fill-current' : ''}`} />
                      </Button>
                    </TableCell>
                    <TableCell>
                      {new Date(senderID.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => openDetailsModal(senderID)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(senderID)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => quickApprove(senderID)} className="text-green-600">
                          <UserCheck className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => quickReject(senderID)} className="text-red-600">
                          <UserX className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o Sender ID "{senderID.sender_id}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteSenderID(senderID.id)} className="bg-red-600 hover:bg-red-700">
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Sender ID</DialogTitle>
            <DialogDescription>
              Modifique as configurações do Sender ID
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-sender-id">Nome do Remetente</Label>
              <Input
                id="edit-sender-id"
                value={newSenderID.sender_id}
                onChange={(e) => setNewSenderID(prev => ({ ...prev, sender_id: e.target.value }))}
                maxLength={11}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status Geral</Label>
                <Select value={newSenderID.status} onValueChange={(value) => setNewSenderID(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Status BulkSMS</Label>
                <Select value={newSenderID.bulksms_status} onValueChange={(value) => setNewSenderID(prev => ({ ...prev, bulksms_status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={newSenderID.is_default}
                onCheckedChange={(checked) => setNewSenderID(prev => ({ ...prev, is_default: checked }))}
              />
              <Label>Definir como padrão para o usuário</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedSenderID(null); resetNewSenderID(); }}>
                Cancelar
              </Button>
              <Button onClick={updateSenderID}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Sender ID</DialogTitle>
            <DialogDescription>
              Informações completas sobre este remetente
            </DialogDescription>
          </DialogHeader>
          
          {selectedSenderID && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nome do Remetente</Label>
                  <p className="text-sm text-muted-foreground">{selectedSenderID.sender_id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Usuário</Label>
                  <p className="text-sm text-muted-foreground">{getUserName(selectedSenderID.user_id)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status Geral</Label>
                  <div className="mt-1">{getStatusBadge(selectedSenderID.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">BulkSMS</Label>
                  <div className="mt-1">{getStatusBadge(selectedSenderID.bulksms_status)}</div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Gateways Suportados</Label>
                <div className="mt-1 flex gap-1">
                  {selectedSenderID.supported_gateways.map(gateway => (
                    <Badge key={gateway} variant="outline">{gateway}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">É Padrão</Label>
                  <p className="text-sm text-muted-foreground">{selectedSenderID.is_default ? 'Sim' : 'Não'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Criado em</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedSenderID.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => { setShowDetailsModal(false); setSelectedSenderID(null); }}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Estatísticas e Informações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total de Sender IDs:</span>
                <Badge variant="outline">{senderIDs.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Aprovados:</span>
                <Badge className="bg-green-600">{senderIDs.filter(s => s.status === 'approved').length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pendentes:</span>
                <Badge variant="secondary">{senderIDs.filter(s => s.status === 'pending').length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Rejeitados:</span>
                <Badge variant="destructive">{senderIDs.filter(s => s.status === 'rejected').length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Máximo 11 caracteres alfanuméricos por Sender ID</p>
              <p>• Aprovação automática para administradores</p>
              <p>• Controle individual por gateway BulkSMS</p>
              <p>• Apenas um Sender ID padrão por usuário</p>
              <p>• Exclusão permanente - use com cuidado</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}