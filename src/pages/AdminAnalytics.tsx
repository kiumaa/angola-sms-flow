import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Users,
  MessageSquare,
  Target,
  DollarSign,
  Phone,
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

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

// Mock data - in production this would come from APIs
const smsVolumeData = [
  { date: '2024-01-15', sent: 4200, delivered: 4100, failed: 100 },
  { date: '2024-01-16', sent: 3800, delivered: 3720, failed: 80 },
  { date: '2024-01-17', sent: 5200, delivered: 5050, failed: 150 },
  { date: '2024-01-18', sent: 4600, delivered: 4510, failed: 90 },
  { date: '2024-01-19', sent: 5800, delivered: 5690, failed: 110 },
  { date: '2024-01-20', sent: 6200, delivered: 6080, failed: 120 },
  { date: '2024-01-21', sent: 7100, delivered: 6950, failed: 150 },
];

const gatewayDistribution = [
  { name: 'BulkSMS', value: 65, color: 'hsl(var(--primary))' },
  { name: 'BulkGate', value: 35, color: 'hsl(var(--secondary))' },
];

const countryDistribution = [
  { name: 'Angola', value: 78, color: '#8884d8' },
  { name: 'Brasil', value: 12, color: '#82ca9d' },
  { name: 'Portugal', value: 6, color: '#ffc658' },
  { name: 'Outros', value: 4, color: '#ff7c7c' },
];

const hourlyActivity = [
  { hour: '00:00', messages: 120 },
  { hour: '02:00', messages: 80 },
  { hour: '04:00', messages: 60 },
  { hour: '06:00', messages: 200 },
  { hour: '08:00', messages: 450 },
  { hour: '10:00', messages: 680 },
  { hour: '12:00', messages: 750 },
  { hour: '14:00', messages: 820 },
  { hour: '16:00', messages: 900 },
  { hour: '18:00', messages: 650 },
  { hour: '20:00', messages: 420 },
  { hour: '22:00', messages: 280 },
];

const deliveryRateData = [
  { date: '15/01', rate: 97.2 },
  { date: '16/01', rate: 98.1 },
  { date: '17/01', rate: 97.8 },
  { date: '18/01', rate: 98.4 },
  { date: '19/01', rate: 98.9 },
  { date: '20/01', rate: 98.1 },
  { date: '21/01', rate: 97.9 },
];

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState("7d");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 2000);
  };

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log("Exporting analytics data...");
  };

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
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
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
          value="47,324"
          change={12.5}
          changeLabel="vs período anterior"
          icon={MessageSquare}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          variant="highlighted"
        />
        <MetricCard
          title="Taxa de Entrega"
          value="98.1%"
          change={0.3}
          changeLabel="vs período anterior"
          icon={Target}
          color="bg-gradient-to-br from-green-500 to-green-600"
          variant="highlighted"
        />
        <MetricCard
          title="Usuários Ativos"
          value="1,847"
          change={-2.1}
          changeLabel="vs período anterior"
          icon={Users}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          variant="highlighted"
        />
        <MetricCard
          title="Receita"
          value="$18,450"
          change={18.7}
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
              <Badge variant="outline">Últimos 7 dias</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={smsVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
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
              <LineChart data={deliveryRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tickFormatter={(value) => `${value}%`}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Taxa de Entrega']}
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
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={gatewayDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {gatewayDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center space-x-4 mt-4">
              {gatewayDistribution.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Country Distribution */}
        <Card className="hover-lift transition-all duration-200">
          <CardHeader>
            <CardTitle>Distribuição por País</CardTitle>
            <CardDescription>Origem dos SMS enviados</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={countryDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {countryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              {countryDistribution.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span>{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
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
              <BarChart data={hourlyActivity}>
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
                  dataKey="messages" 
                  fill="hsl(var(--primary))" 
                  radius={[2, 2, 0, 0]}
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
            <div className="p-4 border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">Melhoria</span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Taxa de entrega aumentou 0.3% esta semana, indicando melhoria na qualidade dos contatos.
              </p>
            </div>

            <div className="p-4 border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800 dark:text-blue-200">Pico de Atividade</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Maior volume de envios entre 14h-18h. Considere programar campanhas neste horário.
              </p>
            </div>

            <div className="p-4 border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-800 dark:text-orange-200">Expansão</span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                78% dos SMS são para Angola. Oportunidade de expansão para outros mercados PALOP.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}