import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, Globe, Zap, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BulkGateMetrics {
  totalSent: number;
  successRate: number;
  averageResponseTime: number;
  creditsUsed: number;
  lastActivity: string;
  status: 'online' | 'offline' | 'error';
  balance: number;
  currency: string;
}

interface RecentActivity {
  id: string;
  timestamp: string;
  phone: string;
  status: string;
  country: string;
  responseTime: number;
  error?: string;
}

export function BulkGateMonitoringDashboard() {
  const [metrics, setMetrics] = useState<BulkGateMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();

  const fetchMetrics = async () => {
    try {
      // Buscar métricas dos últimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: smsLogs, error: logsError } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('gateway_used', 'bulkgate')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Calcular métricas
      const totalSent = smsLogs?.length || 0;
      const successfulSends = smsLogs?.filter(log => log.status === 'delivered' || log.status === 'sent').length || 0;
      const successRate = totalSent > 0 ? (successfulSends / totalSent) * 100 : 0;
      const creditsUsed = smsLogs?.reduce((sum, log) => sum + (log.cost_credits || 0), 0) || 0;

      // Testar status atual
      const { data: statusData, error: statusError } = await supabase.functions.invoke('gateway-status', {
        body: { gateway_name: 'bulkgate' }
      });

      const gatewayStatus = statusData || {};

      setMetrics({
        totalSent,
        successRate,
        averageResponseTime: gatewayStatus.response_time || 0,
        creditsUsed,
        lastActivity: smsLogs?.[0]?.created_at || '',
        status: gatewayStatus.status === 'online' ? 'online' : gatewayStatus.error ? 'error' : 'offline',
        balance: gatewayStatus.balance || 0,
        currency: 'EUR'
      });

      // Atividade recente
      const recent = smsLogs?.slice(0, 10).map(log => ({
        id: log.id,
        timestamp: log.created_at,
        phone: log.phone_number,
        status: log.status,
        country: log.country_detected || 'AO',
        responseTime: 0, // Seria calculado se tivéssemos dados de tempo de resposta
        error: log.error_message
      })) || [];

      setRecentActivity(recent);
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Error fetching BulkGate metrics:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar métricas do BulkGate",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Zap className="h-8 w-8 animate-pulse mx-auto mb-2 text-blue-500" />
          <p>Carregando métricas do BulkGate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Zap className="h-6 w-6 text-blue-500" />
            <span>BulkGate - Monitoramento</span>
          </h2>
          <p className="text-muted-foreground">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={fetchMetrics} variant="outline">
          Atualizar
        </Button>
      </div>

      {metrics && (
        <>
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(metrics.status)}
                      <span className="font-medium capitalize">{metrics.status}</span>
                    </div>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="text-lg font-bold">
                      {metrics.balance} {metrics.currency}
                    </p>
                  </div>
                  <Globe className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">SMS Enviados (7d)</p>
                    <p className="text-lg font-bold">{metrics.totalSent}</p>
                  </div>
                  <Zap className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                    <p className="text-lg font-bold">{metrics.successRate.toFixed(1)}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Tempo de Resposta Médio</span>
                  <span className="font-medium">{metrics.averageResponseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Créditos Utilizados (7d)</span>
                  <span className="font-medium">{metrics.creditsUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Última Atividade</span>
                  <span className="font-medium">
                    {metrics.lastActivity ? new Date(metrics.lastActivity).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recentActivity.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma atividade recente
                    </p>
                  ) : (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-2 border-b">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm">{activity.phone}</span>
                            <Badge className={getStatusColor(activity.status)}>
                              {activity.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {activity.country}
                            </span>
                          </div>
                          {activity.error && (
                            <p className="text-xs text-red-600 mt-1">{activity.error}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts */}
          {metrics.status === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                BulkGate está com problemas. Verifique a configuração ou tente novamente mais tarde.
              </AlertDescription>
            </Alert>
          )}

          {metrics.balance < 10 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Saldo baixo no BulkGate ({metrics.balance} {metrics.currency}). 
                Considere recarregar para evitar interrupções no serviço.
              </AlertDescription>
            </Alert>
          )}

          {metrics.successRate < 90 && metrics.totalSent > 10 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Taxa de sucesso abaixo de 90% ({metrics.successRate.toFixed(1)}%). 
                Verifique a qualidade dos números de telefone ou configurações.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}