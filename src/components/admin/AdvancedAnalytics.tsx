import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange } from "react-day-picker";
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
  PieChart,
  Pie,
  Cell
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
  Calendar,
  Filter
} from "lucide-react";
import { addDays, format } from "date-fns";

// Mock analytics data
const campaignPerformanceData = [
  { date: '2024-01-15', campaigns: 5, sent: 12500, delivered: 12100, clicks: 1450 },
  { date: '2024-01-16', campaigns: 8, sent: 18900, delivered: 18200, clicks: 2180 },
  { date: '2024-01-17', campaigns: 3, sent: 8500, delivered: 8300, clicks: 950 },
  { date: '2024-01-18', campaigns: 12, sent: 25000, delivered: 24100, clicks: 3020 },
  { date: '2024-01-19', campaigns: 7, sent: 15600, delivered: 15100, clicks: 1890 },
  { date: '2024-01-20', campaigns: 9, sent: 21300, delivered: 20800, clicks: 2560 },
  { date: '2024-01-21', campaigns: 6, sent: 14200, delivered: 13900, clicks: 1670 }
];

const audienceSegmentData = [
  { name: 'Ativos', value: 45, growth: 12.5, color: '#8884d8' },
  { name: 'Novos', value: 25, growth: 18.2, color: '#82ca9d' },
  { name: 'VIP', value: 20, growth: -3.1, color: '#ffc658' },
  { name: 'Inativos', value: 10, growth: -15.7, color: '#ff7c7c' }
];

const topCampaignsData = [
  { name: 'Black Friday', sent: 25000, delivered: 24100, rate: 96.4, clicks: 3650 },
  { name: 'Consulta Médica', sent: 18500, delivered: 18200, rate: 98.4, clicks: 1820 },
  { name: 'Nova Oferta', sent: 15600, delivered: 15100, rate: 96.8, clicks: 2265 },
  { name: 'Evento Corporativo', sent: 12300, delivered: 11800, rate: 95.9, clicks: 1180 },
  { name: 'Confirmação Pedido', sent: 9800, delivered: 9650, rate: 98.5, clicks: 580 }
];

const conversionFunnelData = [
  { stage: 'Enviado', value: 100000, percentage: 100 },
  { stage: 'Entregue', value: 97500, percentage: 97.5 },
  { stage: 'Aberto', value: 45000, percentage: 45 },
  { stage: 'Clicou', value: 8500, percentage: 8.5 },
  { stage: 'Converteu', value: 1200, percentage: 1.2 }
];

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

interface DatePickerWithRangeProps {
  className?: string;
  date?: DateRange;
  setDate?: (date: DateRange | undefined) => void;
}

const DatePickerWithRange = ({ className, date, setDate }: DatePickerWithRangeProps) => {
  return (
    <div className={className}>
      <Button variant="outline" className="justify-start text-left font-normal">
        <Calendar className="mr-2 h-4 w-4" />
        {date?.from ? (
          date.to ? (
            <>
              {format(date.from, "LLL dd, y")} -{" "}
              {format(date.to, "LLL dd, y")}
            </>
          ) : (
            format(date.from, "LLL dd, y")
          )
        ) : (
          <span>Selecionar período</span>
        )}
      </Button>
    </div>
  );
};

export const AdvancedAnalytics = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [period, setPeriod] = useState("7d");
  const [segment, setSegment] = useState("all");

  const totalSent = campaignPerformanceData.reduce((sum, day) => sum + day.sent, 0);
  const totalDelivered = campaignPerformanceData.reduce((sum, day) => sum + day.delivered, 0);
  const totalClicks = campaignPerformanceData.reduce((sum, day) => sum + day.clicks, 0);
  const deliveryRate = ((totalDelivered / totalSent) * 100).toFixed(1);
  const clickRate = ((totalClicks / totalDelivered) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Analytics Avançado</h1>
          <p className="text-muted-foreground">Análise detalhada de performance das campanhas</p>
        </div>
        <div className="flex items-center space-x-3">
          <DatePickerWithRange
            className="grid gap-2"
            date={dateRange}
            setDate={setDateRange}
          />
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Período:</span>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
            <SelectItem value="90d">90 dias</SelectItem>
            <SelectItem value="1y">1 ano</SelectItem>
          </SelectContent>
        </Select>
        <Select value={segment} onValueChange={setSegment}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os segmentos</SelectItem>
            <SelectItem value="active">Usuários ativos</SelectItem>
            <SelectItem value="new">Novos usuários</SelectItem>
            <SelectItem value="vip">Clientes VIP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="SMS Enviados"
          value={totalSent.toLocaleString()}
          subtitle="Total do período"
          trend={{ value: 12.5, isPositive: true }}
          icon={MessageSquare}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <MetricCard
          title="Taxa de Entrega"
          value={`${deliveryRate}%`}
          subtitle="SMS entregues com sucesso"
          trend={{ value: 2.3, isPositive: true }}
          icon={Target}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <MetricCard
          title="Taxa de Clique"
          value={`${clickRate}%`}
          subtitle="Engajamento médio"
          trend={{ value: 1.8, isPositive: true }}
          icon={TrendingUp}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
        <MetricCard
          title="ROI Médio"
          value="3.4x"
          subtitle="Retorno sobre investimento"
          trend={{ value: 8.7, isPositive: true }}
          icon={DollarSign}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
      </div>

      {/* Performance Over Time */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance das Campanhas</CardTitle>
            <CardDescription>Volume e engajamento ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={campaignPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy')}
                />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.8}
                  name="Enviados"
                />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.8}
                  name="Entregues"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segmentação de Audiência</CardTitle>
            <CardDescription>Distribuição e crescimento por segmento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {audienceSegmentData.map((segment, index) => (
                <div key={segment.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="font-medium">{segment.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-bold">{segment.value}%</span>
                    <div className={`flex items-center space-x-1 text-sm ${
                      segment.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {segment.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span>{Math.abs(segment.growth)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Campaigns & Conversion Funnel */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Campanhas</CardTitle>
            <CardDescription>Melhores performances do período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCampaignsData.map((campaign, index) => (
                <div key={campaign.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <span className="font-medium">{campaign.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {campaign.sent.toLocaleString()} enviados • {campaign.rate}% entrega
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{campaign.clicks.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">cliques</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funil de Conversão</CardTitle>
            <CardDescription>Jornada do usuário desde o envio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversionFunnelData.map((stage, index) => (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{stage.stage}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {stage.value.toLocaleString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {stage.percentage}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada de Performance</CardTitle>
          <CardDescription>Métricas avançadas de engajamento e conversão</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={campaignPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => format(new Date(value), 'dd/MM')}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy')}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="sent"
                stroke="#8884d8"
                strokeWidth={2}
                name="SMS Enviados"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="delivered"
                stroke="#82ca9d"
                strokeWidth={2}
                name="SMS Entregues"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="clicks"
                stroke="#ffc658"
                strokeWidth={2}
                name="Cliques"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};