import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Download,
  RefreshCw,
  Users,
  MessageSquare,
  Target,
  DollarSign,
  Globe,
  Clock,
  AlertCircle
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar,
  LineChart,
  Line
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import { AnalyticsEmptyState } from "@/components/admin/AnalyticsEmptyState";
import { exportAnalyticsToCSV, formatKwanza, formatNumber } from "@/lib/analyticsUtils";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = React.useState("7days");
  const { toast } = useToast();
  
  const { data, isLoading, error, refetch, isFetching } = useAdminAnalytics(timeRange);

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Atualizando...",
      description: "Buscando dados mais recentes",
    });
  };

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
        description: "Arquivo CSV foi baixado",
      });
    } catch (err) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar os dados",
        variant: "destructive",
      });
    }
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "24h": return "Últimas 24h";
      case "7days": return "Últimos 7 dias";
      case "30days": return "Últimos 30 dias";
      case "90days": return "Últimos 90 dias";
      default: return "Últimos 7 dias";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-6 bg-gradient-hero">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar analytics</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Erro desconhecido"}
            <Button variant="link" className="ml-2" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data || data.isEmpty) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-6 bg-gradient-hero">
          <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-primary shadow-glow">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Análise detalhada do desempenho da plataforma SMS
          </p>
        </div>
        <AnalyticsEmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 bg-gradient-hero">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-primary shadow-glow">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">
              Análise detalhada do desempenho da plataforma SMS
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="90days">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de SMS"
          value={formatNumber(data.smsMetrics.totalSent)}
          change={data.smsMetrics.trend}
          changeLabel="vs período anterior"
          icon={MessageSquare}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          variant="highlighted"
        />
        <MetricCard
          title="Taxa de Entrega"
          value={`${data.smsMetrics.deliveryRate.toFixed(1)}%`}
          change={data.smsMetrics.trend}
          changeLabel="vs período anterior"
          icon={Target}
          color="bg-gradient-to-br from-green-500 to-green-600"
          variant="highlighted"
        />
        <MetricCard
          title="Usuários Ativos"
          value={formatNumber(data.userMetrics.activeUsers)}
          change={data.userMetrics.trend}
          changeLabel="vs período anterior"
          icon={Users}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          variant="highlighted"
        />
        <MetricCard
          title="Receita"
          value={formatKwanza(data.financialMetrics.revenue)}
          change={data.financialMetrics.trend}
          changeLabel="vs período anterior"
          icon={DollarSign}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          variant="highlighted"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* SMS Volume Chart */}
        <Card className="hover-lift transition-all duration-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Volume de SMS por Dia</CardTitle>
                <CardDescription>Enviados vs Entregues vs Falharam</CardDescription>
              </div>
              <Badge variant="outline">{getTimeRangeLabel()}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={data.chartData.volumeByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                  name="Entregues"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                  name="Falharam"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Delivery Rate Trend */}
        <Card className="hover-lift transition-all duration-200">
          <CardHeader>
            <CardTitle>Taxa de Entrega</CardTitle>
            <CardDescription>Tendência da qualidade de entrega</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data.chartData.deliveryRateTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Taxa de Entrega']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Gateway Distribution */}
        <Card className="hover-lift transition-all duration-200">
          <CardHeader>
            <CardTitle>Distribuição por Gateway</CardTitle>
            <CardDescription>Uso dos provedores SMS</CardDescription>
          </CardHeader>
          <CardContent>
            {data.chartData.gatewayDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.chartData.gatewayDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.chartData.gatewayDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} SMS`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {data.chartData.gatewayDistribution.map((item, index) => (
                    <div key={item.name} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="text-sm">{item.name}: {item.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados de gateway
              </div>
            )}
          </CardContent>
        </Card>

        {/* Country Distribution */}
        <Card className="hover-lift transition-all duration-200">
          <CardHeader>
            <CardTitle>Distribuição por País</CardTitle>
            <CardDescription>Destino dos SMS enviados</CardDescription>
          </CardHeader>
          <CardContent>
            {data.chartData.countryDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.chartData.countryDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {data.chartData.countryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} SMS`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  {data.chartData.countryDistribution.map((item, index) => (
                    <div key={item.name} className="flex items-center space-x-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span>{item.name}: {item.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados de país
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hourly Activity */}
        <Card className="hover-lift transition-all duration-200">
          <CardHeader>
            <CardTitle>Atividade por Hora</CardTitle>
            <CardDescription>Volume de SMS por hora do dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.chartData.hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="hour" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[2, 2, 0, 0]}
                  name="SMS"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="hover-lift transition-all duration-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Insights de Performance
          </CardTitle>
          <CardDescription>Análises e recomendações baseadas nos dados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.insights.map((insight, index) => (
              <div 
                key={index}
                className={`p-4 border-l-4 rounded-lg ${
                  insight.type === 'success' 
                    ? 'border-l-green-500 bg-green-50 dark:bg-green-950/20' 
                    : insight.type === 'warning'
                    ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20'
                    : 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {insight.type === 'success' && <TrendingUp className="h-4 w-4 text-green-600" />}
                  {insight.type === 'warning' && <AlertCircle className="h-4 w-4 text-orange-600" />}
                  {insight.type === 'info' && <Clock className="h-4 w-4 text-blue-600" />}
                  <span className={`font-medium ${
                    insight.type === 'success' 
                      ? 'text-green-800 dark:text-green-200' 
                      : insight.type === 'warning'
                      ? 'text-orange-800 dark:text-orange-200'
                      : 'text-blue-800 dark:text-blue-200'
                  }`}>
                    {insight.title}
                  </span>
                </div>
                <p className={`text-sm ${
                  insight.type === 'success' 
                    ? 'text-green-700 dark:text-green-300' 
                    : insight.type === 'warning'
                    ? 'text-orange-700 dark:text-orange-300'
                    : 'text-blue-700 dark:text-blue-300'
                }`}>
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
