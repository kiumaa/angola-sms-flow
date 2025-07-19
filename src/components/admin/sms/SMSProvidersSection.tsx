
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Wifi, 
  WifiOff, 
  TestTube, 
  Save, 
  Settings, 
  Shield,
  AlertTriangle,
  CheckCircle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SMSConfiguration {
  gateways: {
    bulksms: {
      active: boolean;
      endpoint: string;
      tokenId: string;
      tokenSecret: string;
      defaultSender: string;
      costPerSMS: number;
      status: 'connected' | 'error' | 'disconnected';
      balance?: { credits: number; currency: string };
      error?: string;
    };
    bulkgate: {
      active: boolean;
      endpoint: string;
      appId: string;
      appToken: string;
      defaultSender: string;
      costPerSMS: number;
      status: 'connected' | 'error' | 'disconnected';
      balance?: { credits: number; currency: string };
      error?: string;
    };
  };
  primaryGateway: 'bulksms' | 'bulkgate';
  useFallback: boolean;
  lastUpdated: string;
}

interface SMSProvidersSectionProps {
  config: SMSConfiguration;
  onSave: (config: SMSConfiguration) => Promise<void>;
  saving: boolean;
}

export default function SMSProvidersSection({ config, onSave, saving }: SMSProvidersSectionProps) {
  const [localConfig, setLocalConfig] = useState(config);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const testGateway = async (gateway: 'bulksms' | 'bulkgate') => {
    setTesting(prev => ({ ...prev, [gateway]: true }));

    try {
      const { data, error } = await supabase.functions.invoke('gateway-status', {
        body: { gateway }
      });

      if (error) throw error;

      // Atualizar status local
      setLocalConfig(prev => ({
        ...prev,
        gateways: {
          ...prev.gateways,
          [gateway]: {
            ...prev.gateways[gateway],
            status: data.status === 'active' ? 'connected' : 'error',
            balance: data.balance,
            error: data.error
          }
        }
      }));

      if (data.status === 'active') {
        toast({
          title: "✅ Teste bem-sucedido",
          description: `Gateway ${gateway} está funcionando corretamente`
        });
      } else {
        toast({
          title: "❌ Teste falhou",
          description: data.error || "Erro na conexão",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error(`Erro ao testar ${gateway}:`, error);
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(prev => ({ ...prev, [gateway]: false }));
    }
  };

  const handleSave = async () => {
    await onSave(localConfig);
  };

  const renderGatewayCard = (
    gateway: 'bulksms' | 'bulkgate',
    title: string,
    description: string
  ) => {
    const gatewayConfig = localConfig.gateways[gateway];
    
    return (
      <Card className="relative">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {gatewayConfig.status === 'connected' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : gatewayConfig.status === 'error' ? (
                <WifiOff className="h-5 w-5 text-red-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor={`${gateway}-active`} className="text-sm">Ativo</Label>
              <Switch
                id={`${gateway}-active`}
                checked={gatewayConfig.active}
                onCheckedChange={(checked) => 
                  setLocalConfig(prev => ({
                    ...prev,
                    gateways: {
                      ...prev.gateways,
                      [gateway]: { ...prev.gateways[gateway], active: checked }
                    }
                  }))
                }
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status e Saldo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="mt-1">
                <Badge 
                  variant={gatewayConfig.status === 'connected' ? 'default' : 'destructive'}
                  className={gatewayConfig.status === 'connected' ? 'bg-green-600' : ''}
                >
                  {gatewayConfig.status === 'connected' ? 'Conectado' : 
                   gatewayConfig.status === 'error' ? 'Erro' : 'Desconectado'}
                </Badge>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Saldo</Label>
              <div className="mt-1">
                <span className="text-sm font-mono">
                  {gatewayConfig.balance ? 
                    `${gatewayConfig.balance.credits} ${gatewayConfig.balance.currency}` : 
                    'N/A'
                  }
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Configurações específicas do gateway */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`${gateway}-endpoint`} className="text-sm">Endpoint</Label>
                <Input
                  id={`${gateway}-endpoint`}
                  value={gatewayConfig.endpoint}
                  onChange={(e) => 
                    setLocalConfig(prev => ({
                      ...prev,
                      gateways: {
                        ...prev.gateways,
                        [gateway]: { ...prev.gateways[gateway], endpoint: e.target.value }
                      }
                    }))
                  }
                  className="text-xs"
                />
              </div>
              
              <div>
                <Label htmlFor={`${gateway}-sender`} className="text-sm">Sender Padrão</Label>
                <Input
                  id={`${gateway}-sender`}
                  value={gatewayConfig.defaultSender}
                  onChange={(e) => 
                    setLocalConfig(prev => ({
                      ...prev,
                      gateways: {
                        ...prev.gateways,
                        [gateway]: { ...prev.gateways[gateway], defaultSender: e.target.value }
                      }
                    }))
                  }
                />
              </div>
            </div>

            {gateway === 'bulksms' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Token ID</Label>
                  <Input type="password" value="***" disabled />
                  <p className="text-xs text-muted-foreground mt-1">
                    Configurado via secrets do Supabase
                  </p>
                </div>
                <div>
                  <Label className="text-sm">Token Secret</Label>
                  <Input type="password" value="***" disabled />
                  <p className="text-xs text-muted-foreground mt-1">
                    Configurado via secrets do Supabase
                  </p>
                </div>
              </div>
            )}

            {gateway === 'bulkgate' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Application ID</Label>
                  <Input type="password" value="***" disabled />
                  <p className="text-xs text-muted-foreground mt-1">
                    Configurado via secrets do Supabase
                  </p>
                </div>
                <div>
                  <Label className="text-sm">Application Token</Label>
                  <Input type="password" value="***" disabled />
                  <p className="text-xs text-muted-foreground mt-1">
                    Configurado via secrets do Supabase
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor={`${gateway}-cost`} className="text-sm">Custo por SMS (créditos)</Label>
              <Input
                id={`${gateway}-cost`}
                type="number"
                min="1"
                value={gatewayConfig.costPerSMS}
                onChange={(e) => 
                  setLocalConfig(prev => ({
                    ...prev,
                    gateways: {
                      ...prev.gateways,
                      [gateway]: { ...prev.gateways[gateway], costPerSMS: parseInt(e.target.value) || 1 }
                    }
                  }))
                }
              />
            </div>
          </div>

          {/* Mensagem de erro se houver */}
          {gatewayConfig.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 font-medium">Erro:</p>
              <p className="text-sm text-red-600">{gatewayConfig.error}</p>
            </div>
          )}

          {/* Botão de teste */}
          <Button
            onClick={() => testGateway(gateway)}
            disabled={testing[gateway]}
            variant="outline"
            className="w-full"
          >
            {testing[gateway] ? (
              <TestTube className="h-4 w-4 mr-2 animate-pulse" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Testar Conexão
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Gateway Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuração Principal</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base font-medium">Gateway Primário</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Selecione qual gateway será usado por padrão para envio de SMS
            </p>
            <RadioGroup
              value={localConfig.primaryGateway}
              onValueChange={(value: 'bulksms' | 'bulkgate') =>
                setLocalConfig(prev => ({ ...prev, primaryGateway: value }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bulksms" id="primary-bulksms" />
                <Label htmlFor="primary-bulksms">BulkSMS</Label>
                {localConfig.gateways.bulksms.status === 'connected' && (
                  <Badge variant="outline" className="text-xs bg-green-50">Online</Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bulkgate" id="primary-bulkgate" />
                <Label htmlFor="primary-bulkgate">BulkGate</Label>
                {localConfig.gateways.bulkgate.status === 'connected' && (
                  <Badge variant="outline" className="text-xs bg-green-50">Online</Badge>
                )}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Fallback Automático</Label>
              <p className="text-sm text-muted-foreground">
                Usar gateway secundário automaticamente se o primário falhar
              </p>
            </div>
            <Switch
              checked={localConfig.useFallback}
              onCheckedChange={(checked) =>
                setLocalConfig(prev => ({ ...prev, useFallback: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Gateways Configuration */}
      <div className="grid gap-6 md:grid-cols-2">
        {renderGatewayCard(
          'bulksms',
          'BulkSMS',
          'Gateway SMS tradicional com alta confiabilidade'
        )}
        
        {renderGatewayCard(
          'bulkgate',
          'BulkGate',
          'Gateway SMS moderno com recursos avançados'
        )}
      </div>

      {/* Save Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <Save className="h-4 w-4 mr-2 animate-pulse" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
