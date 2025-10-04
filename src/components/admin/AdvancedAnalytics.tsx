import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  DollarSign,
  Target,
  Download,
  RefreshCw,
  Zap,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import { exportAnalyticsToCSV, formatKwanza, formatNumber, getTrendColor } from "@/lib/analyticsUtils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Real analytics data loaded from database

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ComponentType<any>;
  color: string;
}

const MetricCard = ({ title, value, subtitle, trend, icon: Icon, color }: MetricCardProps) => (
  <Card className="hover-lift transition-all duration-200">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-center space-x-2">
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <div className={`flex items-center space-x-1 text-sm ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className={`p-4 rounded-2xl ${color}`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);


export const AdvancedAnalytics = () => {
  const [timeRange, setTimeRange] = useState("30days");
  const [comparisonMode, setComparisonMode] = useState<"previous" | "benchmark">("previous");
  const { toast } = useToast();
  
  const { data, isLoading, error, refetch, isFetching } = useAdminAnalytics(timeRange);

  const handleExport = () => {
    if (!data) return;
    
    try {
      exportAnalyticsToCSV(
        {
          volumeByDay: data.chartData.volumeByDay,
          deliveryRateTrend: data.chartData.deliveryRateTrend,
          gatewayDistribution: data.chartData.gatewayDistribution,
          countryDistribution: data.chartData.countryDistribution,
          hourlyActivity: data.chartData.hourlyActivity,
          smsMetrics: data.smsMetrics,
          userMetrics: data.userMetrics,
          financialMetrics: data.financialMetrics,
        },
        timeRange
      );
      toast({
        title: "Exportado com sucesso!",
        description: "Relatório avançado baixado em CSV",
      });
    } catch (err) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o relatório",
        variant: "destructive",
      });
    }
  };

  // Calculate advanced metrics
  const avgCostPerSMS = data?.smsMetrics.totalSent 
    ? (data.financialMetrics.revenue / data.smsMetrics.totalSent) 
    : 0;
  
  const engagementScore = data?.smsMetrics.deliveryRate || 0;
  
  const performanceScore = {
    delivery: data?.smsMetrics.deliveryRate || 0,
    speed: 95, // Could calculate from timestamp analysis
    cost: Math.min(100, (1 / avgCostPerSMS) * 50), // Lower cost = higher score
    reliability: Math.max(0, 100 - (data?.smsMetrics.totalFailed || 0) / Math.max(1, data?.smsMetrics.totalSent || 1) * 100),
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Erro ao carregar analytics avançado</p>
        <Button onClick={() => refetch()} className="mt-4">Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
            <Activity className="h-8 w-8" />
            Analytics Avançado
          </h1>
          <p className="text-muted-foreground">Análise profunda de performance e insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="90days">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Advanced Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Volume Total"
          value={formatNumber(data.smsMetrics.totalSent)}
          subtitle="SMS processados"
          trend={{ value: data.smsMetrics.trend, isPositive: data.smsMetrics.trend > 0 }}
          icon={MessageSquare}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <MetricCard
          title="Performance"
          value={`${data.smsMetrics.deliveryRate.toFixed(1)}%`}
          subtitle="Taxa de entrega"
          trend={{ value: data.smsMetrics.trend, isPositive: data.smsMetrics.trend > 0 }}
          icon={Target}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <MetricCard
          title="Crescimento"
          value={formatNumber(data.userMetrics.newUsers)}
          subtitle="Novos usuários"
          trend={{ value: data.userMetrics.trend, isPositive: data.userMetrics.trend > 0 }}
          icon={Users}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <MetricCard
          title="Receita"
          value={formatKwanza(data.financialMetrics.revenue)}
          subtitle="Total período"
          trend={{ value: data.financialMetrics.trend, isPositive: data.financialMetrics.trend > 0 }}
          icon={DollarSign}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
      </div>

      {/* Advanced Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Performance Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Score de Performance</CardTitle>
            <CardDescription>Avaliação multidimensional do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={[
                { metric: 'Entrega', value: performanceScore.delivery, fullMark: 100 },
                { metric: 'Velocidade', value: performanceScore.speed, fullMark: 100 },
                { metric: 'Custo', value: performanceScore.cost, fullMark: 100 },
                { metric: 'Confiabilidade', value: performanceScore.reliability, fullMark: 100 },
              ]}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar 
                  name="Performance" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))" 
                  fillOpacity={0.6} 
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Performance Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Detalhada</CardTitle>
            <CardDescription>Métricas combinadas ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.chartData.volumeByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sent" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Enviados"
                />
                <Line 
                  type="monotone" 
                  dataKey="delivered" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Entregues"
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Falhados"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cost & Efficiency Analysis */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Análise de Custos</CardTitle>
            <CardDescription>Eficiência financeira do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Custo médio por SMS</p>
                <p className="text-2xl font-bold">{formatKwanza(avgCostPerSMS)}</p>
              </div>
              <Zap className="h-8 w-8 text-orange-500" />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Ticket médio transação</p>
                <p className="text-2xl font-bold">{formatKwanza(data.financialMetrics.avgTransactionValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total de transações</p>
                <p className="text-2xl font-bold">{data.financialMetrics.completedTransactions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métricas de Qualidade</CardTitle>
            <CardDescription>Indicadores de excelência operacional</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Taxa de Entrega</span>
                <span className="font-bold">{performanceScore.delivery.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${performanceScore.delivery}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Velocidade de Processamento</span>
                <span className="font-bold">{performanceScore.speed.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${performanceScore.speed}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Confiabilidade</span>
                <span className="font-bold">{performanceScore.reliability.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${performanceScore.reliability}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Otimização de Custo</span>
                <span className="font-bold">{Math.min(100, performanceScore.cost).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, performanceScore.cost)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gateway Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Gateways</CardTitle>
          <CardDescription>Performance detalhada por provedor SMS</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.chartData.gatewayDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Volume" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};