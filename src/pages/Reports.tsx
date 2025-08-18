import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  BarChart3, 
  Calendar as CalendarIcon,
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  Zap,
  Target,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { useReports } from "@/hooks/useReports";

const Reports = () => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [timeRange, setTimeRange] = useState("30");
  const { campaigns, metrics, loading, fetchReports, exportToCsv } = useReports();

  const handleDateFilter = () => {
    fetchReports(
      dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
      dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined
    );
  };

  const handleTimeRangeFilter = (range: string) => {
    setTimeRange(range);
    const days = parseInt(range);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    fetchReports(format(startDate, 'yyyy-MM-dd'));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Rascunho", variant: "secondary" as const, icon: Clock, color: "bg-gray-500" },
      scheduled: { label: "Agendada", variant: "outline" as const, icon: CalendarIcon, color: "bg-blue-500" },
      queued: { label: "Na Fila", variant: "default" as const, icon: Activity, color: "bg-yellow-500" },
      sending: { label: "Enviando", variant: "default" as const, icon: MessageSquare, color: "bg-orange-500" },
      completed: { label: "Concluída", variant: "default" as const, icon: CheckCircle, color: "bg-green-500" },
      cancelled: { label: "Cancelada", variant: "destructive" as const, icon: XCircle, color: "bg-red-500" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} text-white border-0 hover-lift`}>
        <Icon className="h-3 w-3 mr-1" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  // Colors for pie chart
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-pulse">
          <div className="glass-card p-8">
            <div className="h-20 bg-muted/20 rounded-3xl"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-6">
                <div className="h-32 bg-muted/20 rounded-2xl"></div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Advanced Header */}
        <div className="glass-card p-8 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="flex justify-between items-center relative">
            <div>
              <h1 className="text-4xl font-light gradient-text mb-2 flex items-center space-x-3">
                <div className="p-3 rounded-3xl bg-gradient-primary shadow-glow animate-glow">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <span>Analytics Avançados</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Insights poderosos sobre o desempenho das suas campanhas SMS
              </p>
            </div>
            
            <div className="flex space-x-4">
              {/* Date Range Picker */}
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn(
                      "w-[140px] justify-start text-left font-normal glass-card border-glass-border rounded-2xl",
                      !dateFrom && "text-muted-foreground"
                    )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass-card border-glass-border">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn(
                      "w-[140px] justify-start text-left font-normal glass-card border-glass-border rounded-2xl",
                      !dateTo && "text-muted-foreground"
                    )}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass-card border-glass-border">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Button onClick={handleDateFilter} className="button-futuristic">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </div>

              <Select value={timeRange} onValueChange={handleTimeRangeFilter}>
                <SelectTrigger className="w-48 glass-card border-glass-border rounded-2xl">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-glass-border">
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={() => exportToCsv(campaigns)}
                disabled={campaigns.length === 0}
                className="button-futuristic"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        {metrics && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total de Campanhas",
                value: metrics.totalCampaigns,
                description: `Últimos ${timeRange} dias`,
                icon: MessageSquare,
                gradient: "from-blue-500 to-purple-600",
                trend: "+15%"
              },
              {
                title: "SMS Enviados",
                value: metrics.totalSent.toLocaleString(),
                description: `${metrics.totalDelivered.toLocaleString()} entregues`,
                icon: Target,
                gradient: "from-green-500 to-emerald-600",
                trend: "+8%"
              },
              {
                title: "Taxa de Entrega",
                value: `${metrics.averageDeliveryRate.toFixed(1)}%`,
                description: `${metrics.totalFailed.toLocaleString()} falharam`,
                icon: CheckCircle,
                gradient: metrics.averageDeliveryRate >= 90 ? "from-green-500 to-emerald-600" : "from-orange-500 to-red-600",
                trend: metrics.averageDeliveryRate >= 90 ? "+2%" : "-2%"
              },
              {
                title: "Créditos Gastos",
                value: metrics.totalCreditsSpent.toLocaleString(),
                description: `${metrics.totalCampaigns > 0 ? Math.round(metrics.totalCreditsSpent / metrics.totalCampaigns) : 0} por campanha`,
                icon: Zap,
                gradient: "from-orange-500 to-yellow-600",
                trend: "+12%"
              }
            ].map((stat, index) => (
              <Card 
                key={index} 
                className="card-futuristic animate-slide-up-stagger cursor-default relative overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`}></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-3 rounded-3xl bg-gradient-to-br ${stat.gradient} shadow-glow hover-lift`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-light gradient-text mb-2">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {stat.description}
                  </p>
                  <div className={`flex items-center text-xs ${stat.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend.startsWith('+') ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {stat.trend} vs período anterior
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Charts and Detailed Analytics */}
        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="glass-card rounded-2xl p-1">
            <TabsTrigger value="campaigns" className="rounded-xl">Campanhas Detalhadas</TabsTrigger>
            <TabsTrigger value="charts" className="rounded-xl">Gráficos & Tendências</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="mt-6">
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle className="text-2xl font-light gradient-text">Histórico de Campanhas</CardTitle>
                <CardDescription className="text-lg">
                  Análise detalhada de todas as suas campanhas com métricas avançadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="p-6 rounded-3xl bg-gradient-primary/10 w-fit mx-auto mb-6">
                      <BarChart3 className="h-16 w-16 text-primary mx-auto" />
                    </div>
                    <h3 className="text-2xl font-light gradient-text mb-4">Nenhuma campanha encontrada</h3>
                    <p className="text-muted-foreground text-lg mb-8">
                      Não há campanhas no período selecionado. Comece criando sua primeira campanha!
                    </p>
                    <Button className="button-futuristic">
                      Criar Primeira Campanha
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {campaigns.map((campaign, index) => (
                      <div 
                        key={campaign.id}
                        className="glass-card p-6 rounded-3xl hover-lift animate-slide-up-stagger"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h4 className="font-semibold text-xl gradient-text">{campaign.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(campaign.created_at).toLocaleDateString('pt-AO', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {getStatusBadge(campaign.status)}
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="text-center p-4 glass-card rounded-2xl">
                            <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
                            <p className="text-2xl font-light gradient-text">{campaign.stats.sent.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Enviados</p>
                          </div>

                          <div className="text-center p-4 glass-card rounded-2xl">
                            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                            <p className="text-2xl font-light gradient-text">{campaign.stats.delivered.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Entregues</p>
                          </div>

                          <div className="text-center p-4 glass-card rounded-2xl">
                            <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-2xl font-light gradient-text">{campaign.delivery_rate.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">Taxa Entrega</p>
                          </div>

                          <div className="text-center p-4 glass-card rounded-2xl">
                            <Zap className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                            <p className="text-2xl font-light gradient-text">{campaign.stats.credits_spent}</p>
                            <p className="text-xs text-muted-foreground">Créditos</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Status Distribution Pie Chart */}
              <Card className="card-futuristic">
                <CardHeader>
                  <CardTitle className="text-xl font-light gradient-text">Distribuição por Status</CardTitle>
                  <CardDescription>
                    Como suas campanhas estão distribuídas por status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics && Object.keys(metrics.campaignsByStatus).length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(metrics.campaignsByStatus).map(([status, count]) => ({
                            name: status,
                            value: count
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(metrics.campaignsByStatus).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Nenhum dado disponível
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Daily Performance Trend */}
              <Card className="card-futuristic">
                <CardHeader>
                  <CardTitle className="text-xl font-light gradient-text">Tendência Diária</CardTitle>
                  <CardDescription>
                    Performance de envios nos últimos 30 dias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics && metrics.dailyStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={metrics.dailyStats}>
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
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Nenhum dado disponível
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Campaign Performance Bar Chart */}
              <Card className="card-futuristic lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xl font-light gradient-text">Performance por Campanha</CardTitle>
                  <CardDescription>
                    Comparativo de performance das suas últimas campanhas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {campaigns.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={campaigns.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="stats.sent" fill="#8884d8" name="Enviados" />
                        <Bar dataKey="stats.delivered" fill="#82ca9d" name="Entregues" />
                        <Bar dataKey="stats.failed" fill="#ff7300" name="Falharam" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                      Nenhuma campanha para exibir
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;