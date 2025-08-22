
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, TrendingUp, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';

interface GatewayStats {
  gateway: string;
  totalSent: number;
  totalFailed: number;
  successRate: number;
  lastUsed: string;
  avgResponseTime: number;
}

interface FallbackStats {
  totalFallbacks: number;
  fallbackSuccessRate: number;
  primaryGatewayFailures: number;
  fallbacksByDate: Array<{ date: string; count: number }>;
}

interface RealtimeStats {
  messagesLast24h: number;
  messagesLast7d: number;
  creditsUsedToday: number;
  activeGateways: number;
}

export default function SMSGatewayMonitoring() {
  const [gatewayStats, setGatewayStats] = useState<GatewayStats[]>([]);
  const [fallbackStats, setFallbackStats] = useState<FallbackStats | null>(null);
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonitoringData();
    const interval = setInterval(loadMonitoringData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMonitoringData = async () => {
    try {
      await Promise.all([
        loadGatewayStats(),
        loadFallbackStats(),
        loadRealtimeStats()
      ]);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGatewayStats = async () => {
    const { data: logs } = await supabase
      .from('sms_logs')
      .select('gateway_used, status, created_at, cost_credits')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (logs) {
      const statsMap = new Map<string, GatewayStats>();
      
      logs.forEach(log => {
        const gateway = log.gateway_used || 'unknown';
        if (!statsMap.has(gateway)) {
          statsMap.set(gateway, {
            gateway,
            totalSent: 0,
            totalFailed: 0,
            successRate: 0,
            lastUsed: log.created_at,
            avgResponseTime: 0
          });
        }
        
        const stats = statsMap.get(gateway)!;
        if (log.status === 'sent') {
          stats.totalSent++;
        } else if (log.status === 'failed') {
          stats.totalFailed++;
        }
        
        if (new Date(log.created_at) > new Date(stats.lastUsed)) {
          stats.lastUsed = log.created_at;
        }
      });

      const finalStats = Array.from(statsMap.values()).map(stats => ({
        ...stats,
        successRate: stats.totalSent + stats.totalFailed > 0 
          ? (stats.totalSent / (stats.totalSent + stats.totalFailed)) * 100 
          : 0
      }));

      setGatewayStats(finalStats);
    }
  };

  const loadFallbackStats = async () => {
    const { data: logs } = await supabase
      .from('sms_logs')
      .select('fallback_attempted, status, created_at, original_gateway, gateway_used')
      .eq('fallback_attempted', true)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (logs) {
      const totalFallbacks = logs.length;
      const successfulFallbacks = logs.filter(log => log.status === 'sent').length;
      const fallbackSuccessRate = totalFallbacks > 0 ? (successfulFallbacks / totalFallbacks) * 100 : 0;
      
      // Count primary gateway failures that triggered fallback
      const primaryFailures = logs.filter(log => log.original_gateway).length;

      // Group fallbacks by date for chart
      const fallbacksByDate = logs.reduce((acc, log) => {
        const date = new Date(log.created_at).toISOString().split('T')[0];
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, [] as Array<{ date: string; count: number }>);

      setFallbackStats({
        totalFallbacks,
        fallbackSuccessRate,
        primaryGatewayFailures: primaryFailures,
        fallbacksByDate
      });
    }
  };

  const loadRealtimeStats = async () => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [messages24h, messages7d, creditsToday, gateways] = await Promise.all([
      supabase.from('sms_logs').select('id', { count: 'exact' }).gte('created_at', last24h.toISOString()),
      supabase.from('sms_logs').select('id', { count: 'exact' }).gte('created_at', last7d.toISOString()),
      supabase.from('sms_logs').select('cost_credits').gte('created_at', todayStart.toISOString()).eq('status', 'sent'),
      supabase.from('sms_gateways').select('id', { count: 'exact' }).eq('is_active', true)
    ]);

    const creditsUsedToday = creditsToday.data?.reduce((sum, log) => sum + (log.cost_credits || 0), 0) || 0;

    setRealtimeStats({
      messagesLast24h: messages24h.count || 0,
      messagesLast7d: messages7d.count || 0,
      creditsUsedToday,
      activeGateways: gateways.count || 0
    });
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Real-time Stats Cards with improved spacing */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Mensagens (24h)</p>
                <p className="text-3xl font-bold text-foreground">{realtimeStats?.messagesLast24h || 0}</p>
                <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Volume Semanal</p>
                <p className="text-3xl font-bold text-foreground">{realtimeStats?.messagesLast7d || 0}</p>
                <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Créditos Hoje</p>
                <p className="text-3xl font-bold text-foreground">{realtimeStats?.creditsUsedToday || 0}</p>
                <p className="text-xs text-muted-foreground">Consumo diário</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Zap className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Gateways Ativos</p>
                <p className="text-3xl font-bold text-foreground">{realtimeStats?.activeGateways || 0}</p>
                <p className="text-xs text-muted-foreground">Operacionais</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gateway Performance with improved layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-foreground">Performance por Gateway</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Taxa de sucesso dos últimos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {gatewayStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={gatewayStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="gateway" 
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="successRate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-center space-y-4">
                <div className="p-4 bg-muted/20 rounded-full">
                  <BarChart className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-muted-foreground">Sem dados de performance</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Nenhuma mensagem foi enviada nos últimos 7 dias. Os gráficos aparecerão assim que houver atividade.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-foreground">Distribuição de Mensagens</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Volume por gateway nos últimos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {gatewayStats.length > 0 && gatewayStats.some(g => g.totalSent > 0) ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={gatewayStats.filter(g => g.totalSent > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ gateway, totalSent }) => `${gateway}: ${totalSent}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="totalSent"
                  >
                    {gatewayStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-center space-y-4">
                <div className="p-4 bg-muted/20 rounded-full">
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-muted-foreground">Nenhuma mensagem enviada</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Aguardando atividade nos gateways para exibir a distribuição de mensagens.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gateway Status Details with improved spacing and empty states */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold text-foreground">Status Detalhado dos Gateways</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Estatísticas individuais e performance de cada gateway configurado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gatewayStats.length > 0 ? (
            <div className="space-y-6">
              {gatewayStats.map((stats) => (
                <div key={stats.gateway} className="border border-border rounded-lg p-6 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-xl text-foreground">{stats.gateway.toUpperCase()}</h3>
                    <Badge variant={stats.successRate >= 95 ? 'default' : stats.successRate >= 80 ? 'secondary' : 'destructive'}>
                      {stats.successRate.toFixed(1)}% sucesso
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Mensagens Enviadas</p>
                      <p className="text-2xl font-bold text-green-600">{stats.totalSent}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Falhas</p>
                      <p className="text-2xl font-bold text-red-600">{stats.totalFailed}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground font-medium">Último Uso</p>
                      <p className="font-semibold text-foreground">{new Date(stats.lastUsed).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground font-medium">Taxa de Sucesso</p>
                      <Progress value={stats.successRate} className="h-2" />
                      <p className="text-xs text-muted-foreground">{stats.successRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="p-6 bg-muted/20 rounded-full">
                <CheckCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-muted-foreground">Nenhum gateway configurado</h3>
                <p className="text-muted-foreground max-w-md">
                  Configure pelo menos um gateway SMS para começar a monitorar as estatísticas de envio.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fallback Statistics */}
      {fallbackStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Estatísticas de Fallback
            </CardTitle>
            <CardDescription>Sistema de recuperação automática dos últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{fallbackStats.totalFallbacks}</p>
                <p className="text-sm text-muted-foreground">Total de Fallbacks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{fallbackStats.fallbackSuccessRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{fallbackStats.primaryGatewayFailures}</p>
                <p className="text-sm text-muted-foreground">Falhas Primário</p>
              </div>
            </div>

            {fallbackStats.totalFallbacks > 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  O sistema de fallback foi ativado {fallbackStats.totalFallbacks} vezes nos últimos 30 dias, 
                  com taxa de sucesso de {fallbackStats.fallbackSuccessRate.toFixed(1)}%. 
                  {fallbackStats.fallbackSuccessRate < 80 && "Considere revisar a configuração dos gateways."}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Excelente! Não houve necessidade de fallback nos últimos 30 dias. 
                  O gateway primário está funcionando perfeitamente.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
