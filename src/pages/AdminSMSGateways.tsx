
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Settings, TestTube, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';


interface Gateway {
  id: string;
  name: string;
  display_name: string;
  is_active: boolean;
  is_primary: boolean;
  api_endpoint: string;
  auth_type: string;
  created_at: string;
  updated_at: string;
}

interface GatewayStatus {
  gateway: string;
  status: 'active' | 'inactive';
  balance?: {
    credits: number;
    currency: string;
  };
  error?: string;
  lastChecked: string;
}

export default function AdminSMSGateways() {
  const { user } = useAuth();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [gatewayStatuses, setGatewayStatuses] = useState<Record<string, GatewayStatus>>({});
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGateways();
    }
  }, [user]);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sms_gateways')
        .select('*')
        .order('name');

      if (error) throw error;

      setGateways(data || []);
      
      // Check status of each gateway
      await checkGatewayStatuses(data || []);
    } catch (error) {
      console.error('Error fetching gateways:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar gateways',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkGatewayStatuses = async (gatewayList: Gateway[]) => {
    const statuses: Record<string, GatewayStatus> = {};

    for (const gateway of gatewayList) {
      try {
        console.log(`Checking status for gateway: ${gateway.name}`);
        
        const { data, error } = await supabase.functions.invoke('gateway-status', {
          body: { gateway: gateway.name }
        });

        if (error) {
          console.error(`Gateway ${gateway.name} error:`, error);
          statuses[gateway.name] = {
            gateway: gateway.name,
            status: 'inactive',
            error: error.message || 'Unknown error',
            lastChecked: new Date().toISOString()
          };
        } else if (data) {
          console.log(`Gateway ${gateway.name} response:`, data);
          statuses[gateway.name] = data;
        } else {
          statuses[gateway.name] = {
            gateway: gateway.name,
            status: 'inactive',
            error: 'No response from gateway',
            lastChecked: new Date().toISOString()
          };
        }
      } catch (error) {
        console.error(`Exception checking ${gateway.name}:`, error);
        statuses[gateway.name] = {
          gateway: gateway.name,
          status: 'inactive',
          error: error.message || 'Connection failed',
          lastChecked: new Date().toISOString()
        };
      }
    }

    console.log('Final gateway statuses:', statuses);
    setGatewayStatuses(statuses);
  };

  const refreshStatuses = async () => {
    setRefreshing(true);
    await checkGatewayStatuses(gateways);
    setRefreshing(false);
    toast({
      title: 'Status Atualizado',
      description: 'Status dos gateways foi atualizado com sucesso',
    });
  };

  const toggleGatewayActive = async (gatewayId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('sms_gateways')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', gatewayId);

      if (error) throw error;

      await fetchGateways();
      
      toast({
        title: 'Sucesso',
        description: `Gateway ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch (error) {
      console.error('Error toggling gateway:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar gateway',
        variant: 'destructive',
      });
    }
  };

  const setPrimaryGateway = async (gatewayId: string) => {
    try {
      // First, set all gateways as non-primary
      await supabase
        .from('sms_gateways')
        .update({ is_primary: false });

      // Then set the selected gateway as primary
      const { error } = await supabase
        .from('sms_gateways')
        .update({ 
          is_primary: true,
          is_active: true, // Auto-activate when set as primary
          updated_at: new Date().toISOString()
        })
        .eq('id', gatewayId);

      if (error) throw error;

      await fetchGateways();
      
      toast({
        title: 'Sucesso',
        description: 'Gateway primário definido com sucesso',
      });
    } catch (error) {
      console.error('Error setting primary gateway:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao definir gateway primário',
        variant: 'destructive',
      });
    }
  };

  const testGateway = async (gatewayName: string) => {
    setTesting(prev => ({ ...prev, [gatewayName]: true }));

    try {
      const { data, error } = await supabase.functions.invoke('gateway-status', {
        body: { gateway: gatewayName }
      });

      if (error) throw error;

      if (data && data.status === 'active') {
        toast({
          title: 'Teste bem-sucedido',
          description: `Gateway ${gatewayName} está funcionando corretamente`,
        });
      } else {
        toast({
          title: 'Teste falhou',
          description: data?.error || 'Erro desconhecido',
          variant: 'destructive',
        });
      }

      // Refresh status after test
      await checkGatewayStatuses(gateways);
    } catch (error) {
      console.error('Error testing gateway:', error);
      toast({
        title: 'Erro no teste',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setTesting(prev => ({ ...prev, [gatewayName]: false }));
    }
  };

  const getGatewayStatusBadge = (gateway: Gateway) => {
    const status = gatewayStatuses[gateway.name];
    
    if (!status) {
      return <Badge variant="secondary">Verificando...</Badge>;
    }

    if (status.status === 'active') {
      return <Badge variant="default" className="bg-green-600">Conectado</Badge>;
    } else {
      return <Badge variant="destructive">
        {status.error === 'Missing credentials' 
          ? 'Não Configurado' 
          : 'Desconectado'}
      </Badge>;
    }
  };

  const getGatewayIcon = (gateway: Gateway) => {
    const status = gatewayStatuses[gateway.name];
    
    if (!status || status.status !== 'active') {
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    }

    return <CheckCircle className="h-5 w-5 text-green-600" />;
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold">Gateways SMS</h1>
          <p className="text-muted-foreground">
            Configure e gerencie os gateways de envio de SMS
          </p>
        </div>
        <Button onClick={refreshStatuses} variant="outline" disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Atualizar Status
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {gateways.map((gateway) => {
          const status = gatewayStatuses[gateway.name];
          
          return (
            <Card key={gateway.id} className="relative">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center space-x-2">
                  {getGatewayIcon(gateway)}
                  <CardTitle className="text-xl">{gateway.display_name}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {gateway.is_primary && (
                    <Badge className="bg-primary">Primário</Badge>
                  )}
                  {getGatewayStatusBadge(gateway)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Switch
                    checked={gateway.is_active}
                    onCheckedChange={(checked) => 
                      toggleGatewayActive(gateway.id, checked)
                    }
                  />
                </div>

                {status?.balance && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Saldo:</span>
                    <span className="text-sm">
                      {status.balance.credits} {status.balance.currency}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Endpoint:</span>
                  <span className="text-xs text-muted-foreground truncate max-w-48">
                    {gateway.api_endpoint}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Autenticação:</span>
                  <span className="text-xs uppercase">
                    {gateway.auth_type}
                  </span>
                </div>

                {status?.error && (
                  <>
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded border">
                      <strong>Erro:</strong> {status.error}
                    </div>

                  </>
                )}

                {status?.lastChecked && (
                  <div className="text-xs text-muted-foreground">
                    Última verificação: {new Date(status.lastChecked).toLocaleString('pt-BR')}
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testGateway(gateway.name)}
                    disabled={testing[gateway.name]}
                    className="flex-1"
                  >
                    {testing[gateway.name] ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <TestTube className="h-4 w-4 mr-2" />
                    )}
                    Testar
                  </Button>

                  {!gateway.is_primary && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setPrimaryGateway(gateway.id)}
                      className="flex-1"
                    >
                      Definir como Primário
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações Avançadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Fallback Automático</div>
              <div className="text-sm text-muted-foreground">
                Utilizar gateway secundário quando o primário falhar
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Log Detalhado</div>
              <div className="text-sm text-muted-foreground">
                Registrar tentativas detalhadas de envio
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Informações Importantes:</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Apenas um gateway pode ser primário por vez</li>
          <li>• O sistema tentará automaticamente o gateway de fallback em caso de falha</li>
          <li>• Certifique-se de configurar as credenciais nos secrets do Supabase</li>
          <li>• BulkSMS requer as secrets BULKSMS_TOKEN_ID e BULKSMS_TOKEN_SECRET</li>
        </ul>
      </div>
    </div>
  );
}
