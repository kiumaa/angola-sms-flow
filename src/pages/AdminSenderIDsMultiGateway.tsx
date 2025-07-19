import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SenderID {
  id: string;
  sender_id: string;
  status: string;
  bulksms_status: string;
  bulkgate_status: string;
  supported_gateways: string[];
  is_default: boolean;
  created_at: string;
}

export default function AdminSenderIDsMultiGateway() {
  const [senderIDs, setSenderIDs] = useState<SenderID[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSender, setEditingSender] = useState<SenderID | null>(null);
  const [formData, setFormData] = useState({
    sender_id: '',
    supported_gateways: [] as string[],
    is_default: false
  });

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
      toast.error('Erro ao carregar Sender IDs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGatewayToggle = (senderId: string, gateway: string, checked: boolean) => {
    setSenderIDs(prev => prev.map(sender => {
      if (sender.id === senderId) {
        const newGateways = checked
          ? [...sender.supported_gateways, gateway]
          : sender.supported_gateways.filter(g => g !== gateway);
        
        return { ...sender, supported_gateways: newGateways };
      }
      return sender;
    }));
  };

  const saveSenderGateways = async (senderId: string, gateways: string[]) => {
    try {
      const { error } = await supabase
        .from('sender_ids')
        .update({ 
          supported_gateways: gateways,
          // Reset gateway-specific status when gateways change
          bulksms_status: gateways.includes('bulksms') ? 'pending' : 'not_supported',
          bulkgate_status: gateways.includes('bulkgate') ? 'pending' : 'not_supported'
        })
        .eq('id', senderId);

      if (error) throw error;
      toast.success('Gateways atualizados com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar gateways:', error);
      toast.error('Erro ao atualizar gateways');
    }
  };

  const openEditDialog = (sender?: SenderID) => {
    if (sender) {
      setEditingSender(sender);
      setFormData({
        sender_id: sender.sender_id,
        supported_gateways: sender.supported_gateways,
        is_default: sender.is_default
      });
    } else {
      setEditingSender(null);
      setFormData({
        sender_id: '',
        supported_gateways: ['bulksms'],
        is_default: false
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveSender = async () => {
    try {
      if (editingSender) {
        // Update existing
        const { error } = await supabase
          .from('sender_ids')
          .update({
            sender_id: formData.sender_id,
            supported_gateways: formData.supported_gateways,
            is_default: formData.is_default,
            bulksms_status: formData.supported_gateways.includes('bulksms') ? 'pending' : 'not_supported',
            bulkgate_status: formData.supported_gateways.includes('bulkgate') ? 'pending' : 'not_supported'
          })
          .eq('id', editingSender.id);

        if (error) throw error;
        toast.success('Sender ID atualizado com sucesso');
      } else {
        // Create new
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('Usuário não autenticado');

        const { error } = await supabase
          .from('sender_ids')
          .insert({
            sender_id: formData.sender_id,
            supported_gateways: formData.supported_gateways,
            is_default: formData.is_default,
            user_id: user.user.id,
            status: 'pending',
            bulksms_status: formData.supported_gateways.includes('bulksms') ? 'pending' : 'not_supported',
            bulkgate_status: formData.supported_gateways.includes('bulkgate') ? 'pending' : 'not_supported'
          });

        if (error) throw error;
        toast.success('Sender ID criado com sucesso');
      }

      setIsDialogOpen(false);
      loadSenderIDs();
    } catch (error) {
      console.error('Erro ao salvar Sender ID:', error);
      toast.error('Erro ao salvar Sender ID');
    }
  };

  const deleteSender = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sender_ids')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Sender ID excluído com sucesso');
      loadSenderIDs();
    } catch (error) {
      console.error('Erro ao excluir Sender ID:', error);
      toast.error('Erro ao excluir Sender ID');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      case 'pending':
        return <Badge variant="outline"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Pendente</Badge>;
      case 'not_supported':
        return <Badge variant="secondary">N/A</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sender IDs Multi-Gateway</h1>
          <p className="text-muted-foreground">
            Gerencie seus Sender IDs e configure para quais gateways cada um está disponível
          </p>
        </div>
        <Button onClick={() => openEditDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Sender ID
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sender IDs Configurados</CardTitle>
          <CardDescription>
            Configure quais gateways cada Sender ID suporta e monitore o status de aprovação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sender ID</TableHead>
                <TableHead>BulkSMS</TableHead>
                <TableHead>BulkGate</TableHead>
                <TableHead>Status BulkSMS</TableHead>
                <TableHead>Status BulkGate</TableHead>
                <TableHead>Padrão</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {senderIDs.map((sender) => (
                <TableRow key={sender.id}>
                  <TableCell className="font-medium">{sender.sender_id}</TableCell>
                  <TableCell>
                    <Checkbox
                      checked={sender.supported_gateways.includes('bulksms')}
                      onCheckedChange={(checked) => {
                        handleGatewayToggle(sender.id, 'bulksms', checked as boolean);
                        const newGateways = checked
                          ? [...sender.supported_gateways, 'bulksms']
                          : sender.supported_gateways.filter(g => g !== 'bulksms');
                        saveSenderGateways(sender.id, newGateways);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={sender.supported_gateways.includes('bulkgate')}
                      onCheckedChange={(checked) => {
                        handleGatewayToggle(sender.id, 'bulkgate', checked as boolean);
                        const newGateways = checked
                          ? [...sender.supported_gateways, 'bulkgate']
                          : sender.supported_gateways.filter(g => g !== 'bulkgate');
                        saveSenderGateways(sender.id, newGateways);
                      }}
                    />
                  </TableCell>
                  <TableCell>{getStatusBadge(sender.bulksms_status)}</TableCell>
                  <TableCell>{getStatusBadge(sender.bulkgate_status)}</TableCell>
                  <TableCell>
                    {sender.is_default && <Badge variant="default">Padrão</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(sender)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSender(sender.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog for creating/editing Sender IDs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSender ? 'Editar Sender ID' : 'Novo Sender ID'}
            </DialogTitle>
            <DialogDescription>
              Configure o Sender ID e selecione os gateways que irão suportá-lo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="sender_id">Sender ID</Label>
              <Input
                id="sender_id"
                value={formData.sender_id}
                onChange={(e) => setFormData(prev => ({ ...prev, sender_id: e.target.value }))}
                placeholder="Ex: MINHAEMPRESA"
              />
            </div>

            <div>
              <Label className="text-base font-medium">Gateways Suportados</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bulksms"
                    checked={formData.supported_gateways.includes('bulksms')}
                    onCheckedChange={(checked) => {
                      const newGateways = checked
                        ? [...formData.supported_gateways, 'bulksms']
                        : formData.supported_gateways.filter(g => g !== 'bulksms');
                      setFormData(prev => ({ ...prev, supported_gateways: newGateways }));
                    }}
                  />
                  <Label htmlFor="bulksms">BulkSMS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bulkgate"
                    checked={formData.supported_gateways.includes('bulkgate')}
                    onCheckedChange={(checked) => {
                      const newGateways = checked
                        ? [...formData.supported_gateways, 'bulkgate']
                        : formData.supported_gateways.filter(g => g !== 'bulkgate');
                      setFormData(prev => ({ ...prev, supported_gateways: newGateways }));
                    }}
                  />
                  <Label htmlFor="bulkgate">BulkGate</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked as boolean }))}
              />
              <Label htmlFor="is_default">Definir como padrão</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveSender}>
              {editingSender ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}