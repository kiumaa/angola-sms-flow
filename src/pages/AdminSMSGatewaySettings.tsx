import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, Loader2, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GatewayStatus {
  gateway: string;
  status: 'active' | 'inactive';
  balance?: {
    credits: number;
    currency: string;
  };
  error?: string;
}

interface GatewayConfig {
  primary: 'bulksms' | 'bulkgate';
  fallbackEnabled: boolean;
}

export default function AdminSMSGatewaySettings() {
  const [bulkSMSStatus, setBulkSMSStatus] = useState<GatewayStatus | null>(null);
  const [bulkGateStatus, setBulkGateStatus] = useState<GatewayStatus | null>(null);
  const [config, setConfig] = useState<GatewayConfig>({
    primary: 'bulksms',
    fallbackEnabled: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [testingGateway, setTestingGateway] = useState<string | null>(null);

  useEffect(() => {
    loadGatewayStatuses();
    loadConfiguration();
  }, []);

  const loadGatewayStatuses = async () => {
    try {
      console.log('Loading gateway statuses...');
      const [bulkSMSResponse, bulkGateResponse] = await Promise.all([
        supabase.functions.invoke('gateway-status', {
          body: { gateway: 'bulksms' }
        }),
        supabase.functions.invoke('gateway-status', {
          body: { gateway: 'bulkgate' }
        })
      ]);

      console.log('BulkSMS Response:', bulkSMSResponse);
      console.log('BulkGate Response:', bulkGateResponse);

      if (bulkSMSResponse.data) setBulkSMSStatus(bulkSMSResponse.data);
      if (bulkGateResponse.data) setBulkGateStatus(bulkGateResponse.data);
    } catch (error) {
      console.error('Erro ao carregar status dos gateways:', error);
      toast.error('Erro ao carregar status dos gateways');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfiguration = async () => {
    try {
      const { data: gateways } = await supabase
        .from('sms_gateways')
        .select('*');

      if (gateways) {
        const primaryGateway = gateways.find(g => g.is_primary);
        if (primaryGateway) {
          setConfig(prev => ({
            ...prev,
            primary: primaryGateway.name as 'bulksms' | 'bulkgate'
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
    }
  };

  const testGateway = async (gatewayName: string) => {
    setTestingGateway(gatewayName);
    try {
      const { data, error } = await supabase.functions.invoke('gateway-status', {
        body: { gateway: gatewayName }
      });

      if (error) throw error;

      if (gatewayName === 'bulksms') {
        setBulkSMSStatus(data);
      } else {
        setBulkGateStatus(data);
      }

      toast.success(`Teste de ${gatewayName} concluído`);
    } catch (error) {
      console.error(`Erro ao testar ${gatewayName}:`, error);
      toast.error(`Erro ao testar ${gatewayName}`);
    } finally {
      setTestingGateway(null);
    }
  };

  const saveConfiguration = async () => {
    try {
      // Update primary gateway by setting all to false first, then the selected one to true
      await supabase
        .from('sms_gateways')
        .update({ is_primary: false });

      await supabase
        .from('sms_gateways')
        .update({ is_primary: true })
        .eq('name', config.primary);

      toast.success('Configuração salva com sucesso');
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    }
  };

  const renderGatewayCard = (
    title: string,
    description: string,
    status: GatewayStatus | null,
    gatewayKey: string
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status?.status === 'active' ? (
            <Wifi className="h-5 w-5 text-success" />
          ) : (
            <WifiOff className="h-5 w-5 text-destructive" />
          )}
          {title}
          {status?.status === 'active' && (
            <Badge variant="default" className="ml-auto">Online</Badge>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={status?.status === 'active' ? 'default' : 'destructive'}>
            {status?.status === 'active' ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <AlertCircle className="h-3 w-3 mr-1" />
            )}
            {status?.status === 'active' ? 'Conectado' : 'Erro'}
          </Badge>
        </div>

        {/* Balance */}
        {status?.balance && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Créditos:</span>
            <span className="text-sm font-mono">
              {status.balance.credits.toLocaleString()} {status.balance.currency}
            </span>
          </div>
        )}

        {/* Last checked */}
        {status?.lastChecked && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Última verificação:</span>
            <span className="text-xs text-muted-foreground">
              {new Date(status.lastChecked).toLocaleString('pt-BR')}
            </span>
          </div>
        )}

        {/* Error message */}
        {status?.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive font-medium">Erro:</p>
            <p className="text-sm text-destructive">{status.error}</p>
            
            {status.error.includes('Missing') && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                <strong>Configuração necessária:</strong> Configure as credenciais no Supabase Dashboard → Settings → Edge Functions
              </div>
            )}
          </div>
        )}

        {/* Test button */}
        <Button 
          onClick={() => testGateway(gatewayKey)}
          disabled={testingGateway === gatewayKey}
          variant="outline"
          className="w-full"
        >
          {testingGateway === gatewayKey ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Testar Conexão
        </Button>
      </CardContent>
    </Card>
  );

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
          <h1 className="text-2xl font-bold">Configurações de Gateways SMS</h1>
          <p className="text-muted-foreground">
            Configure e gerencie seus provedores de SMS
          </p>
        </div>
        <Button 
          onClick={loadGatewayStatuses} 
          variant="outline"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Atualizar Status
        </Button>
      </div>

      {/* Primary Gateway Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Gateway Primário e Fallback</CardTitle>
          <CardDescription>
            Escolha o gateway principal e configure o fallback automático
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium">Gateway Primário</Label>
            <RadioGroup
              value={config.primary}
              onValueChange={(value) => setConfig(prev => ({ ...prev, primary: value as 'bulksms' | 'bulkgate' }))}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bulksms" id="bulksms" />
                <Label htmlFor="bulksms">BulkSMS</Label>
                {bulkSMSStatus?.status === 'active' && (
                  <Badge variant="outline" className="text-xs">Online</Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bulkgate" id="bulkgate" />
                <Label htmlFor="bulkgate">BulkGate</Label>
                {bulkGateStatus?.status === 'active' && (
                  <Badge variant="outline" className="text-xs">Online</Badge>
                )}
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Fallback Automático</Label>
              <p className="text-sm text-muted-foreground">
                Se o gateway primário falhar, reenviar pelo secundário
              </p>
            </div>
            <Switch
              checked={config.fallbackEnabled}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, fallbackEnabled: checked }))}
            />
          </div>

          <Button onClick={saveConfiguration} className="w-full">
            Salvar Configuração
          </Button>
        </CardContent>
      </Card>

      {/* Gateway Status Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {renderGatewayCard(
          "BulkSMS",
          "Gateway SMS tradicional com alta confiabilidade",
          bulkSMSStatus,
          "bulksms"
        )}
        
        {renderGatewayCard(
          "BulkGate",
          "Gateway SMS moderno com recursos avançados",
          bulkGateStatus,
          "bulkgate"
        )}
      </div>

      {/* System Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">
                {config.primary.toUpperCase()}
              </p>
              <p className="text-sm text-muted-foreground">Gateway Primário</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {config.fallbackEnabled ? 'ATIVO' : 'INATIVO'}
              </p>
              <p className="text-sm text-muted-foreground">Fallback Automático</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {(bulkSMSStatus?.status === 'active' ? 1 : 0) + (bulkGateStatus?.status === 'active' ? 1 : 0)}/2
              </p>
              <p className="text-sm text-muted-foreground">Gateways Online</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
