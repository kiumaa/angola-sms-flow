import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProductionMonitoring } from '@/hooks/useProductionMonitoring';
import { Activity, AlertTriangle, CheckCircle, RefreshCw, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ProductionMonitoringDashboard() {
  const { healthStatus, performanceMetrics, loading, refetchHealth, refetchPerformance } = useProductionMonitoring();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Monitoramento de Produção</h2>
          <p className="text-muted-foreground">
            Status do sistema em tempo real
          </p>
        </div>
        <Button 
          onClick={() => {
            refetchHealth();
            refetchPerformance();
          }}
          disabled={loading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Estado do Sistema</CardTitle>
            <Badge variant={getStatusColor(healthStatus?.system_status)}>
              {getStatusIcon(healthStatus?.system_status)}
              <span className="ml-2">{healthStatus?.system_status || 'Verificando...'}</span>
            </Badge>
          </div>
          <CardDescription>
            Última verificação: {healthStatus?.timestamp ? new Date(healthStatus.timestamp).toLocaleString('pt-AO') : 'N/A'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
              <p className="text-2xl font-bold">{healthStatus?.metrics.total_users || 0}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Configs SMS Ativas</p>
              <p className="text-2xl font-bold">{healthStatus?.metrics.active_sms_configs || 0}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Pedidos Pendentes</p>
              <p className="text-2xl font-bold">{healthStatus?.metrics.pending_credit_requests || 0}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">SMS Falhados (24h)</p>
              <p className="text-2xl font-bold text-destructive">
                {healthStatus?.metrics.failed_sms_24h || 0}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Dados Órfãos</p>
              <p className="text-2xl font-bold text-warning">
                {healthStatus?.metrics.orphaned_data || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Métricas de Performance
          </CardTitle>
          <CardDescription>
            Última medição: {performanceMetrics?.lastChecked?.toLocaleString('pt-AO') || 'N/A'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Tempo de Resposta</p>
              <p className="text-2xl font-bold">
                {performanceMetrics?.responseTime ? `${performanceMetrics.responseTime.toFixed(0)}ms` : 'N/A'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Conexões Ativas</p>
              <p className="text-2xl font-bold">{performanceMetrics?.activeConnections || 0}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Taxa de Erros</p>
              <p className="text-2xl font-bold">{performanceMetrics?.errorRate || 0}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {healthStatus?.recommendations && healthStatus.recommendations.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Recomendações do Sistema</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {healthStatus.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm">• {rec}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
