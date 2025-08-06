
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Settings2, Wifi, WifiOff, AlertTriangle } from "lucide-react";

interface SMSConfiguration {
  gateways: {
    bulksms: {
      active: boolean;
      status: 'connected' | 'error' | 'disconnected';
      balance?: { credits: number; currency: string };
    };
    bulkgate: {
      active: boolean;
      status: 'connected' | 'error' | 'disconnected';
      balance?: { credits: number; currency: string };
    };
  };
  primaryGateway: 'bulksms' | 'bulkgate';
  useFallback: boolean;
  lastUpdated: string;
}

interface SMSConfigurationHeaderProps {
  config: SMSConfiguration;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function SMSConfigurationHeader({ config, onRefresh, refreshing }: SMSConfigurationHeaderProps) {
  const getGatewayStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'error':
        return <WifiOff className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getGatewayStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-600">Conectado</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconectado</Badge>;
    }
  };

  const activeGateways = Object.values(config.gateways).filter(g => g.active).length;
  const connectedGateways = Object.values(config.gateways).filter(g => g.status === 'connected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Settings2 className="h-8 w-8" />
            <span>Configurações SMS</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie provedores SMS, gateways e configurações de envio
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline" disabled={refreshing}>
          {refreshing ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Atualizar Status
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gateway Primário</CardTitle>
            {getGatewayStatusIcon(config.gateways[config.primaryGateway].status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {config.primaryGateway}
            </div>
            <div className="mt-2">
              {getGatewayStatusBadge(config.gateways[config.primaryGateway].status)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gateways Ativos</CardTitle>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {activeGateways}/2
            </div>
            <p className="text-xs text-muted-foreground">
              Gateways configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Conexão</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {connectedGateways}/2
            </div>
            <p className="text-xs text-muted-foreground">
              Gateways conectados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fallback</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {config.useFallback ? 'ATIVO' : 'INATIVO'}
            </div>
            <p className="text-xs text-muted-foreground">
              Fallback automático
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status dos Gateways</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getGatewayStatusIcon(config.gateways.bulksms.status)}
                <div>
                  <p className="font-medium">BulkSMS</p>
                  <p className="text-sm text-muted-foreground">
                    {config.gateways.bulksms.balance ? 
                      `${config.gateways.bulksms.balance.credits} ${config.gateways.bulksms.balance.currency}` : 
                      'Saldo não disponível'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {config.primaryGateway === 'bulksms' && (
                  <Badge variant="outline" className="text-xs">Primário</Badge>
                )}
                {getGatewayStatusBadge(config.gateways.bulksms.status)}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getGatewayStatusIcon(config.gateways.bulkgate.status)}
                <div>
                  <p className="font-medium">BulkGate</p>
                  <p className="text-sm text-muted-foreground">
                    {config.gateways.bulkgate.balance ? 
                      `${config.gateways.bulkgate.balance.credits} ${config.gateways.bulkgate.balance.currency}` : 
                      'Saldo não disponível'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {config.primaryGateway === 'bulkgate' && (
                  <Badge variant="outline" className="text-xs">Primário</Badge>
                )}
                {getGatewayStatusBadge(config.gateways.bulkgate.status)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
