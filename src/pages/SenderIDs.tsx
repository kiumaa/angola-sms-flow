import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Check, Clock, X, Star } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

interface SenderID {
  id: string;
  user_id: string;
  sender_id: string;
  is_default: boolean;
  status: string;
  bulksms_status: string;
  supported_gateways: string[];
  created_at: string;
}

const SenderIDs = () => {
  const [senderIds, setSenderIds] = useState<SenderID[]>([]);
  const [newSenderId, setNewSenderId] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchSenderIds();
  }, []);

  const fetchSenderIds = async () => {
    try {
      const { data, error } = await supabase
        .from('sender_ids')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSenderIds(data || []);
    } catch (error: any) {
      console.error('Error fetching sender IDs:', error);
      toast({
        title: "Erro ao carregar Sender IDs",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addSenderId = async () => {
    if (!newSenderId.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Digite um Sender ID válido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('sender_ids')
        .insert({
          user_id: user?.id,
          sender_id: newSenderId.trim(),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Sender ID adicionado",
        description: "Aguarde aprovação do administrador",
      });

      setNewSenderId("");
      fetchSenderIds();
    } catch (error: any) {
      console.error('Error adding sender ID:', error);
      toast({
        title: "Erro ao adicionar Sender ID",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setDefaultSenderId = async (senderId: string) => {
    try {
      // Update all sender IDs to not default
      await supabase
        .from('sender_ids')
        .update({ is_default: false })
        .eq('user_id', user?.id);

      // Set the selected one as default
      const { error } = await supabase
        .from('sender_ids')
        .update({ is_default: true })
        .eq('user_id', user?.id)
        .eq('sender_id', senderId);

      if (error) throw error;

      // Update profile default sender ID
      await supabase
        .from('profiles')
        .update({ default_sender_id: senderId })
        .eq('user_id', user?.id);

      toast({
        title: "Sender ID padrão atualizado",
        description: `${senderId} é agora seu Sender ID padrão`,
      });

      fetchSenderIds();
    } catch (error: any) {
      console.error('Error setting default sender ID:', error);
      toast({
        title: "Erro ao definir Sender ID padrão",
        description: error.message,
        variant: "destructive",
      });
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

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold">Sender IDs</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus Sender IDs personalizados para campanhas SMS
          </p>
        </div>

        {/* Add New Sender ID */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Sender ID</CardTitle>
            <CardDescription>
              Solicite aprovação para usar um Sender ID personalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div className="flex-1">
                <Label htmlFor="senderId">Sender ID</Label>
                <Input
                  id="senderId"
                  placeholder="Ex: MinhaEmpresa"
                  value={newSenderId}
                  onChange={(e) => setNewSenderId(e.target.value)}
                  maxLength={11}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Máximo 11 caracteres, apenas letras e números
                </p>
              </div>
              <div className="flex items-center">
                <Button 
                  onClick={addSenderId}
                  disabled={loading}
                  className="btn-gradient"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Existing Sender IDs */}
        <Card>
          <CardHeader>
            <CardTitle>Seus Sender IDs</CardTitle>
            <CardDescription>
              Lista de todos os seus Sender IDs solicitados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {senderIds.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Nenhum Sender ID cadastrado ainda
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {senderIds.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(item.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{item.sender_id}</span>
                          {item.is_default && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Criado em {new Date(item.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(item.status)}
                      {item.status === 'approved' && !item.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDefaultSenderId(item.sender_id)}
                        >
                          Definir como Padrão
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                <h3 className="font-medium text-blue-900">Como funciona?</h3>
                <p className="text-blue-700 text-sm mt-1">
                  1. Adicione seu Sender ID personalizado<br/>
                  2. Aguarde aprovação do administrador<br/>
                  3. Após aprovado, defina como padrão<br/>
                  4. Suas campanhas usarão o Sender ID personalizado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SenderIDs;
