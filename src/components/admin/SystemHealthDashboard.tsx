import { useSystemHealth } from "@/hooks/useSystemHealth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { 
  Activity, 
  Database, 
  Shield, 
  Zap, 
  HardDrive, 
  RefreshCw,
  Users,
  Send,
  TrendingUp,
  Clock
} from "lucide-react";

const SystemHealthDashboard = () => {
  const {
    health,
    metrics,
    healthChecks,
    loading,
    runAllHealthChecks,
    getStatusColor,
    getStatusIcon
  } = useSystemHealth();

  const getComponentIcon = (component: string) => {
    switch (component.toLowerCase()) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'authentication':
        return <Shield className="h-4 w-4" />;
      case 'sms gateways':
        return <Send className="h-4 w-4" />;
      case 'edge functions':
        return <Zap className="h-4 w-4" />;
      case 'storage':
        return <HardDrive className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">System Health</h2>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">System Health</h2>
        <Button 
          onClick={runAllHealthChecks}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Status Geral do Sistema</span>
            <Badge 
              variant={health.overall === 'healthy' ? 'default' : 'destructive'}
              className="ml-auto"
            >
              {getStatusIcon(health.overall)} {health.overall.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(health).slice(0, -1).map(([component, status]) => (
              <div key={component} className="text-center">
                <div className="flex justify-center mb-2">
                  {getComponentIcon(component)}
                </div>
                <p className="text-sm font-medium capitalize">{component}</p>
                <p className={`text-xs ${getStatusColor(status)}`}>
                  {getStatusIcon(status)} {status}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total de Usuários</p>
                <p className="text-2xl font-bold">{metrics.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.activeUsers24h} ativos (24h)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Send className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Campanhas Totais</p>
                <p className="text-2xl font-bold">{metrics.totalCampaigns.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.totalMessagesSent.toLocaleString()} mensagens
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Taxa de Entrega</p>
                <p className="text-2xl font-bold">{metrics.averageDeliveryRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  Uptime: {metrics.systemUptime}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Tempo de Resposta</p>
                <p className="text-2xl font-bold">{metrics.responseTime}ms</p>
                <p className="text-xs text-muted-foreground">
                  Erro: {metrics.errorRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Health Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes dos Componentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthChecks.map((check, index) => (
              <div key={check.component}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getComponentIcon(check.component)}
                    <div>
                      <p className="font-medium">{check.component}</p>
                      <p className="text-sm text-muted-foreground">
                        {check.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={check.status === 'healthy' ? 'default' : 'destructive'}
                    >
                      {getStatusIcon(check.status)} {check.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {check.responseTime}ms
                    </p>
                  </div>
                </div>
                {index < healthChecks.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Recommendations */}
      {health.overall !== 'healthy' && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200">
              ⚠️ Recomendações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {health.database === 'critical' && (
                <p>• <strong>Database:</strong> Verifique a conectividade com o Supabase</p>
              )}
              {health.smsGateways === 'critical' && (
                <p>• <strong>SMS Gateways:</strong> Configure pelo menos um gateway ativo</p>
              )}
              {health.edgeFunctions === 'warning' && (
                <p>• <strong>Edge Functions:</strong> Resposta lenta detectada</p>
              )}
              {health.authentication === 'critical' && (
                <p>• <strong>Authentication:</strong> Problemas no sistema de autenticação</p>
              )}
              {health.storage === 'critical' && (
                <p>• <strong>Storage:</strong> Verifique as configurações de armazenamento</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SystemHealthDashboard;