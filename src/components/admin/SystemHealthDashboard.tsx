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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Saúde do Sistema</h2>
        <Button 
          onClick={runAllHealthChecks}
          variant="outline"
          size="sm"
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar Status
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

      {/* System Metrics with improved spacing */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                <p className="text-3xl font-bold text-foreground">{metrics.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.activeUsers24h} ativos nas últimas 24h
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Campanhas Totais</p>
                <p className="text-3xl font-bold text-foreground">{metrics.totalCampaigns.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.totalMessagesSent.toLocaleString()} mensagens enviadas
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Send className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Taxa de Entrega</p>
                <p className="text-3xl font-bold text-foreground">{metrics.averageDeliveryRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  Uptime: {metrics.systemUptime}% hoje
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tempo de Resposta</p>
                <p className="text-3xl font-bold text-foreground">{metrics.responseTime}ms</p>
                <p className="text-xs text-muted-foreground">
                  Taxa de erro: {metrics.errorRate}%
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Health Checks with improved spacing */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold text-foreground">Detalhes dos Componentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {healthChecks.map((check, index) => (
              <div key={check.component}>
                <div className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/20 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-muted/30 rounded-lg">
                      {getComponentIcon(check.component)}
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{check.component}</p>
                      <p className="text-sm text-muted-foreground">
                        {check.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <Badge 
                      variant={check.status === 'healthy' ? 'default' : 'destructive'}
                      className="px-3 py-1"
                    >
                      {getStatusIcon(check.status)} {check.status.toUpperCase()}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Resposta: {check.responseTime}ms
                    </p>
                  </div>
                </div>
                {index < healthChecks.length - 1 && <Separator className="mt-6" />}
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