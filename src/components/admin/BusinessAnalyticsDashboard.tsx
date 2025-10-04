import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBusinessAnalytics } from '@/hooks/useBusinessAnalytics';
import { TrendingUp, Users, MessageSquare, DollarSign, Activity, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function BusinessAnalyticsDashboard() {
  const { analytics, loading, refetch } = useBusinessAnalytics('monthly');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    description 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    trend?: number; 
    description?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend !== undefined && (
          <div className="flex items-center mt-2">
            <TrendingUp className={`h-4 w-4 mr-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-xs ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend >= 0 ? '+' : ''}{formatPercentage(trend)} vs mês anterior
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Activity className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics de Negócio</h2>
          <p className="text-muted-foreground">
            Métricas e KPIs para tomada de decisão
          </p>
        </div>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Receita Total"
              value={formatCurrency(analytics?.metrics.revenue.total || 0)}
              icon={DollarSign}
              description="Últimos 12 meses"
            />
            <MetricCard
              title="Usuários Ativos"
              value={analytics?.metrics.users.active || 0}
              icon={Users}
              description={`${analytics?.metrics.users.new_this_month || 0} novos este mês`}
            />
            <MetricCard
              title="SMS Enviados"
              value={analytics?.metrics.sms.total_sent.toLocaleString('pt-AO') || 0}
              icon={MessageSquare}
              description="Total no período"
            />
            <MetricCard
              title="Taxa de Sucesso"
              value={formatPercentage(analytics?.metrics.sms.success_rate || 0)}
              icon={Activity}
              description="SMS entregues com sucesso"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumo de Performance</CardTitle>
              <CardDescription>Principais indicadores do negócio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Receita Mensal Média</span>
                    <Badge variant="secondary">
                      {formatCurrency(analytics?.metrics.revenue.monthly || 0)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Custo Médio por SMS</span>
                    <Badge variant="outline">
                      {analytics?.metrics.sms.avg_cost_per_sms.toFixed(2)} créditos
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total de Usuários</span>
                    <Badge variant="secondary">
                      {analytics?.metrics.users.total}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Crescimento Mensal</span>
                    <Badge variant="outline">
                      {analytics?.metrics.users.new_this_month} usuários
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Receita Total"
              value={formatCurrency(analytics?.metrics.revenue.total || 0)}
              icon={DollarSign}
            />
            <MetricCard
              title="Receita Mensal Média"
              value={formatCurrency(analytics?.metrics.revenue.monthly || 0)}
              icon={TrendingUp}
            />
            <MetricCard
              title="Receita Semanal Média"
              value={formatCurrency(analytics?.metrics.revenue.weekly || 0)}
              icon={Activity}
            />
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Total de Usuários"
              value={analytics?.metrics.users.total || 0}
              icon={Users}
            />
            <MetricCard
              title="Usuários Ativos"
              value={analytics?.metrics.users.active || 0}
              icon={Activity}
            />
            <MetricCard
              title="Novos Este Mês"
              value={analytics?.metrics.users.new_this_month || 0}
              icon={TrendingUp}
            />
          </div>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Total Enviados"
              value={analytics?.metrics.sms.total_sent.toLocaleString('pt-AO') || 0}
              icon={MessageSquare}
            />
            <MetricCard
              title="Taxa de Sucesso"
              value={formatPercentage(analytics?.metrics.sms.success_rate || 0)}
              icon={Activity}
            />
            <MetricCard
              title="Custo Médio"
              value={`${analytics?.metrics.sms.avg_cost_per_sms.toFixed(2)} créditos`}
              icon={DollarSign}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
