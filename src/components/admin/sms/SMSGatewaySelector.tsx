import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, AlertCircle, Settings, Zap } from "lucide-react";

interface GatewayConfig {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  is_primary: boolean;
  api_endpoint: string;
  auth_type: string;
}

export default function SMSGatewaySelector() {
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_gateways')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const gatewayList = data || [];
      setGateways(gatewayList);
      
      // Find current primary gateway
      const primary = gatewayList.find(g => g.is_primary);
      if (primary) {
        setSelectedGateway(primary.id);
      }
    } catch (error: any) {
      console.error('Error fetching gateways:', error);
      toast({
        title: "Erro ao carregar gateways",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePrimaryGateway = async () => {
    if (!selectedGateway) return;

    setUpdating(true);
    try {
      // First, set all gateways to not primary
      await supabase
        .from('sms_gateways')
        .update({ is_primary: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

      // Then set the selected one as primary
      const { error } = await supabase
        .from('sms_gateways')
        .update({ is_primary: true })
        .eq('id', selectedGateway);

      if (error) throw error;

      toast({
        title: "Gateway atualizado",
        description: "Gateway SMS primário foi atualizado com sucesso",
      });

      fetchGateways();
    } catch (error: any) {
      console.error('Error updating primary gateway:', error);
      toast({
        title: "Erro ao atualizar gateway",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getGatewayStatus = (gateway: GatewayConfig) => {
    if (gateway.is_primary && gateway.is_active) {
      return <Badge className="bg-green-600"><Check className="h-3 w-3 mr-1" />Ativo (Primário)</Badge>;
    } else if (gateway.is_active) {
      return <Badge variant="secondary">Ativo</Badge>;
    } else {
      return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Inativo</Badge>;
    }
  };

  const getGatewayDescription = (gatewayName: string) => {
    switch (gatewayName) {
      case 'routee':
        return 'Gateway OAuth 2.0 com suporte a webhooks e balanceamento';
      case 'bulksms':
        return 'Gateway especializado para Sender IDs customizados';
      case 'bulkgate':
        return 'Gateway alternativo com suporte global';
      case 'africastalking':
        return 'Gateway otimizado para África';
      default:
        return 'Gateway SMS configurado';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Settings className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Carregando gateways...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2" />
          Seleção de Gateway SMS
        </CardTitle>
        <CardDescription>
          Escolha o gateway primário para envio de SMS. O sistema usará este gateway por padrão.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {gateways.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum gateway SMS configurado
            </p>
            <p className="text-sm text-muted-foreground">
              Configure pelo menos um gateway para enviar SMS
            </p>
          </div>
        ) : (
          <>
            <RadioGroup 
              value={selectedGateway} 
              onValueChange={setSelectedGateway}
              className="space-y-4"
            >
              {gateways.map((gateway) => (
                <div key={gateway.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={gateway.id} id={gateway.id} />
                      <Label htmlFor={gateway.id} className="font-medium cursor-pointer">
                        {gateway.display_name}
                      </Label>
                    </div>
                    {getGatewayStatus(gateway)}
                  </div>
                  
                  <div className="ml-6 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {getGatewayDescription(gateway.name)}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Endpoint: {gateway.api_endpoint}</span>
                      <span>Auth: {gateway.auth_type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Gateway selecionado será usado para todos os novos envios
              </div>
              <Button 
                onClick={updatePrimaryGateway}
                disabled={updating || !selectedGateway}
                className="bg-primary hover:bg-primary/90"
              >
                {updating ? (
                  <>
                    <Settings className="h-4 w-4 mr-2 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Definir como Primário
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Info about Sender IDs */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 rounded-full p-1">
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Sender IDs Customizados</h4>
              <p className="text-blue-700 text-sm mt-1">
                Para usar Sender IDs customizados, recomendamos o gateway <strong>BulkSMS</strong> 
                que oferece melhor suporte para remetentes personalizados aprovados internamente.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}