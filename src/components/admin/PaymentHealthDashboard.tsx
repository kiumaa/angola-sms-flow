import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CheckCircle2, XCircle, Clock, TrendingUp, Activity } from "lucide-react";

interface PaymentMetric {
  payment_method: string;
  status: string;
  response_time_ms: number;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  amount: number | null;
}

interface MethodStats {
  method: string;
  total: number;
  success: number;
  error: number;
  timeout: number;
  successRate: number;
  avgResponseTime: number;
}

const COLORS = {
  qrcode: '#10B981',
  mcx: '#3B82F6',
  referencia: '#8B5CF6'
};

const STATUS_COLORS = {
  success: '#10B981',
  error: '#EF4444',
  timeout: '#F59E0B'
};

export const PaymentHealthDashboard = () => {
  const [metrics, setMetrics] = useState<PaymentMetric[]>([]);
  const [stats, setStats] = useState<MethodStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(24); // horas

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      const since = new Date();
      since.setHours(since.getHours() - timeRange);

      const { data, error } = await supabase
        .from('payment_metrics')
        .select('*')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMetrics(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: PaymentMetric[]) => {
    const methodGroups = data.reduce((acc, metric) => {
      if (!acc[metric.payment_method]) {
        acc[metric.payment_method] = [];
      }
      acc[metric.payment_method].push(metric);
      return acc;
    }, {} as Record<string, PaymentMetric[]>);

    const methodStats: MethodStats[] = Object.entries(methodGroups).map(([method, methodMetrics]) => {
      const total = methodMetrics.length;
      const success = methodMetrics.filter(m => m.status === 'success').length;
      const error = methodMetrics.filter(m => m.status === 'error').length;
      const timeout = methodMetrics.filter(m => m.status === 'timeout').length;
      const successRate = total > 0 ? (success / total) * 100 : 0;
      
      const responseTimes = methodMetrics
        .filter(m => m.response_time_ms)
        .map(m => m.response_time_ms);
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      return {
        method,
        total,
        success,
        error,
        timeout,
        successRate,
        avgResponseTime
      };
    });

    setStats(methodStats);
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      qrcode: 'QR Code',
      mcx: 'MCX Express',
      referencia: 'Referência EMIS'
    };
    return labels[method] || method;
  };

  const totalTransactions = metrics.length;
  const overallSuccessRate = totalTransactions > 0
    ? (metrics.filter(m => m.status === 'success').length / totalTransactions) * 100
    : 0;

  const pieData = stats.map(s => ({
    name: getMethodLabel(s.method),
    value: s.total
  }));

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Activity className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2">Carregando métricas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Transações</CardDescription>
            <CardTitle className="text-3xl">{totalTransactions}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Últimas {timeRange}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taxa de Sucesso Geral</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {overallSuccessRate.toFixed(1)}%
              {overallSuccessRate >= 95 ? (
                <CheckCircle2 className="w-6 h-6 text-success" />
              ) : (
                <XCircle className="w-6 h-6 text-destructive" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={overallSuccessRate >= 95 ? "default" : "destructive"} className={overallSuccessRate >= 95 ? "bg-success text-white" : ""}>
              {overallSuccessRate >= 95 ? "Excelente" : "Requer Atenção"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tempo Médio de Resposta</CardDescription>
            <CardTitle className="text-3xl">
              {stats.length > 0
                ? Math.round(stats.reduce((sum, s) => sum + s.avgResponseTime, 0) / stats.length)
                : 0}ms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Método Mais Usado</CardDescription>
            <CardTitle className="text-xl">
              {stats.length > 0
                ? getMethodLabel(stats.sort((a, b) => b.total - a.total)[0].method)
                : 'N/A'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendingUp className="w-4 h-4 text-primary" />
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taxa de Sucesso por Método */}
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Sucesso por Método</CardTitle>
            <CardDescription>Últimas {timeRange} horas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" tickFormatter={getMethodLabel} />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'successRate') return `${value.toFixed(1)}%`;
                    return value;
                  }}
                  labelFormatter={getMethodLabel}
                />
                <Legend />
                <Bar dataKey="success" fill={STATUS_COLORS.success} name="Sucesso" />
                <Bar dataKey="error" fill={STATUS_COLORS.error} name="Erro" />
                <Bar dataKey="timeout" fill={STATUS_COLORS.timeout} name="Timeout" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição de Métodos */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Métodos</CardTitle>
            <CardDescription>Volume por método de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas Detalhadas por Método</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Método</th>
                  <th className="text-right p-2">Total</th>
                  <th className="text-right p-2">Sucesso</th>
                  <th className="text-right p-2">Erro</th>
                  <th className="text-right p-2">Taxa Sucesso</th>
                  <th className="text-right p-2">Tempo Médio</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(stat => (
                  <tr key={stat.method} className="border-b">
                    <td className="p-2 font-medium">{getMethodLabel(stat.method)}</td>
                    <td className="text-right p-2">{stat.total}</td>
                    <td className="text-right p-2 text-success">{stat.success}</td>
                    <td className="text-right p-2 text-destructive">{stat.error + stat.timeout}</td>
                    <td className="text-right p-2">
                      <Badge variant={stat.successRate >= 90 ? "default" : "destructive"} className={stat.successRate >= 90 ? "bg-success text-white" : ""}>
                        {stat.successRate.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="text-right p-2">{Math.round(stat.avgResponseTime)}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top 5 Erros */}
      {metrics.filter(m => m.error_code).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Erros Mais Frequentes</CardTitle>
            <CardDescription>Últimas {timeRange} horas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(
                metrics
                  .filter(m => m.error_code)
                  .reduce((acc, m) => {
                    const key = `${m.error_code}: ${m.error_message}`;
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([error, count]) => (
                  <div key={error} className="flex justify-between items-center p-2 border rounded">
                    <span className="text-sm">{error}</span>
                    <Badge variant="destructive">{count}x</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
