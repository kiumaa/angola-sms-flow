import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  Server, 
  Database, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  MessageSquare,
  Zap
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SystemMetrics {
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeUsers: number;
  messagesPerHour: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  dbConnections: number;
  queueLength: number;
}

interface SystemAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
}

export function SystemHealthDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    uptime: 99.99,
    responseTime: 120,
    errorRate: 0.01,
    activeUsers: 247,
    messagesPerHour: 1843,
    cpuUsage: 45,
    memoryUsage: 67,
    diskUsage: 34,
    dbConnections: 12,
    queueLength: 5
  });

  const [alerts, setAlerts] = useState<SystemAlert[]>([
    {
      id: '1',
      type: 'warning',
      title: 'Alto uso de memória detectado',
      description: 'Servidor principal usando 78% da memória disponível',
      timestamp: new Date(Date.now() - 300000),
      resolved: false
    },
    {
      id: '2',
      type: 'info',
      title: 'Backup automático concluído',
      description: 'Backup diário das 03:00 executado com sucesso',
      timestamp: new Date(Date.now() - 3600000),
      resolved: true
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const refreshMetrics = async () => {
    setIsLoading(true);
    try {
      // Simular chamada para métricas do sistema
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMetrics(prev => ({
        ...prev,
        responseTime: Math.floor(Math.random() * 50) + 100,
        activeUsers: Math.floor(Math.random() * 100) + 200,
        messagesPerHour: Math.floor(Math.random() * 500) + 1500,
        cpuUsage: Math.floor(Math.random() * 30) + 35,
        memoryUsage: Math.floor(Math.random() * 20) + 60,
        queueLength: Math.floor(Math.random() * 10)
      }));
      
      setLastUpdate(new Date());
      toast.success("Métricas atualizadas com sucesso");
    } catch (error) {
      toast.error("Erro ao atualizar métricas");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return <Badge variant="default" className="bg-green-100 text-green-800">Saudável</Badge>;
    if (value <= thresholds.warning) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
    return <Badge variant="destructive">Crítico</Badge>;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      refreshMetrics();
    }, 30000); // Atualizar a cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Monitoramento do Sistema</h2>
          <p className="text-muted-foreground">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <Button 
          onClick={refreshMetrics} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar Métricas
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.uptime}%</div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.responseTime, { good: 150, warning: 300 })}`}>
              {metrics.responseTime}ms
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(metrics.responseTime, { good: 150, warning: 300 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              +12% vs ontem
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens/Hora</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.messagesPerHour}</div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="h-3 w-3" />
              +5% vs média
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resources" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resources">Recursos do Sistema</TabsTrigger>
          <TabsTrigger value="database">Banco de Dados</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Uso de Recursos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">CPU</span>
                    <span className="text-sm text-muted-foreground">{metrics.cpuUsage}%</span>
                  </div>
                  <Progress value={metrics.cpuUsage} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Memória</span>
                    <span className="text-sm text-muted-foreground">{metrics.memoryUsage}%</span>
                  </div>
                  <Progress value={metrics.memoryUsage} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Disco</span>
                    <span className="text-sm text-muted-foreground">{metrics.diskUsage}%</span>
                  </div>
                  <Progress value={metrics.diskUsage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Processamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fila de Processamento</span>
                  <Badge variant={metrics.queueLength > 10 ? "destructive" : "default"}>
                    {metrics.queueLength} itens
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Taxa de Erro</span>
                  <Badge variant={metrics.errorRate > 1 ? "destructive" : "default"}>
                    {metrics.errorRate}%
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Threads Ativas</span>
                  <Badge variant="outline">24/32</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Status do Banco de Dados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Conexões Ativas</span>
                    <span className="text-sm">{metrics.dbConnections}/100</span>
                  </div>
                  <Progress value={(metrics.dbConnections / 100) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pool de Conexões</span>
                    <Badge variant="default">Saudável</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tempo de Query (avg)</span>
                    <span className="text-sm">45ms</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Último Backup</span>
                    <span className="text-sm text-green-600">Há 3 horas</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas do Sistema
              </CardTitle>
              <CardDescription>
                Monitoramento proativo de problemas e anomalias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <Alert key={alert.id} className={`${
                    alert.type === 'critical' ? 'border-red-200 bg-red-50' :
                    alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      {alert.resolved ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : alert.type === 'critical' ? (
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{alert.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <AlertDescription className="mt-1">
                          {alert.description}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Throughput</span>
                  <span className="text-sm">1,247 req/min</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Latência P95</span>
                  <span className="text-sm">240ms</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Cache Hit Rate</span>
                  <span className="text-sm text-green-600">94.2%</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Apdex Score</span>
                  <span className="text-sm text-green-600">0.98</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Otimizações Sugeridas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Cache de Queries</p>
                    <p className="text-xs text-muted-foreground">
                      Implementar cache para queries frequentes
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Compressão de Imagens</p>
                    <p className="text-xs text-muted-foreground">
                      Reduzir tamanho dos assets estáticos
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <TrendingDown className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Pool de Conexões</p>
                    <p className="text-xs text-muted-foreground">
                      Ajustar tamanho do pool para pico de uso
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}