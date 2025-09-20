import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  DollarSign,
  Server,
  Clock,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  RefreshCw,
  Download
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#8884d8', '#82ca9d', '#ffc658'];

// Data will be loaded from useDashboardStats hook

// Gateway distribution will be calculated from real SMS logs

const userGrowthData = [
  { month: 'Jan', users: 150 },
  { month: 'Fev', users: 180 },
  { month: 'Mar', users: 220 },
  { month: 'Abr', users: 280 },
  { month: 'Mai', users: 350 },
  { month: 'Jun', users: 420 },
];

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ComponentType<any>;
  color: string;
  loading?: boolean;
}

const KPICard = ({ title, value, change, changeLabel, icon: Icon, color, loading }: KPICardProps) => {
  const isPositive = change >= 0;
  
  return (
    <Card className="hover-lift transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold">{loading ? "..." : value}</p>
              <div className={`flex items-center space-x-1 text-xs ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                <span>{Math.abs(change)}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{changeLabel}</p>
          </div>
          <div className={`p-3 rounded-2xl ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface SystemHealthWidgetProps {
  loading?: boolean;
}

const SystemHealthWidget = ({ loading }: SystemHealthWidgetProps) => {
  const healthMetrics = [
    { name: 'Database', status: 'healthy', uptime: '99.9%' },
    { name: 'SMS Gateways', status: 'warning', uptime: '98.5%' },
    { name: 'API Response', status: 'healthy', uptime: '99.7%' },
    { name: 'Storage', status: 'healthy', uptime: '100%' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      default: return Clock;
    }
  };

  return (
    <Card className="hover-lift transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Saúde do Sistema</CardTitle>
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>Status dos componentes críticos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {healthMetrics.map((metric) => {
            const StatusIcon = getStatusIcon(metric.status);
            return (
              <div key={metric.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <StatusIcon className={`h-4 w-4 ${getStatusColor(metric.status).split(' ')[0]}`} />
                  <span className="text-sm font-medium">{metric.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">{metric.uptime}</span>
                  <Badge variant="outline" className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

interface RecentActivityWidgetProps {
  loading?: boolean;
}

const RecentActivityWidget = ({ loading }: RecentActivityWidgetProps) => {
  const activities = [
    { id: 1, action: 'Novo usuário registrado', user: 'João Silva', time: '2 min atrás', type: 'user' },
    { id: 2, action: 'Campanha SMS enviada', user: 'Sistema', time: '5 min atrás', type: 'sms' },
    { id: 3, action: 'Créditos adicionados', user: 'Admin', time: '12 min atrás', type: 'credit' },
    { id: 4, action: 'Gateway BulkSMS reconectado', user: 'Sistema', time: '25 min atrás', type: 'system' },
    { id: 5, action: 'Relatório gerado', user: 'Maria Costa', time: '1h atrás', type: 'report' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return Users;
      case 'sms': return MessageSquare;
      case 'credit': return DollarSign;
      case 'system': return Server;
      case 'report': return Download;
      default: return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-600';
      case 'sms': return 'bg-green-100 text-green-600';
      case 'credit': return 'bg-orange-100 text-orange-600';
      case 'system': return 'bg-purple-100 text-purple-600';
      case 'report': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Card className="hover-lift transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Atividade Recente</CardTitle>
        <CardDescription>Últimas ações na plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const ActivityIcon = getActivityIcon(activity.type);
            return (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                  <ActivityIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">por {activity.user} • {activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardWidgets = () => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Usuários Ativos"
          value="1,247"
          change={12.5}
          changeLabel="vs mês anterior"
          icon={Users}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          loading={refreshing}
        />
        <KPICard
          title="SMS Enviados (Hoje)"
          value="8,429"
          change={-2.3}
          changeLabel="vs ontem"
          icon={MessageSquare}
          color="bg-gradient-to-br from-green-500 to-green-600"
          loading={refreshing}
        />
        <KPICard
          title="Taxa de Entrega"
          value="97.8%"
          change={0.5}
          changeLabel="vs semana anterior"
          icon={Target}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          loading={refreshing}
        />
        <KPICard
          title="Receita (Mês)"
          value="$12,450"
          change={18.7}
          changeLabel="vs mês anterior"
          icon={DollarSign}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          loading={refreshing}
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* SMS Volume Chart */}
        <Card className="hover-lift transition-all duration-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Volume de SMS</CardTitle>
                <CardDescription>Últimos 7 dias</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRefresh}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  stackId="1"
                  stroke={COLORS[0]}
                  fill={COLORS[0]}
                  fillOpacity={0.8}
                  name="Entregues"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.8}
                  name="Falharam"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gateway Distribution */}
        <Card className="hover-lift transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Distribuição por Gateway</CardTitle>
            <CardDescription>Uso dos provedores de SMS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              {[].map((item: any, index: number) => (
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
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* User Growth */}
        <Card className="hover-lift transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Crescimento de Usuários</CardTitle>
            <CardDescription>Novos registros por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* System Health */}
        <SystemHealthWidget loading={refreshing} />

        {/* Recent Activity */}
        <RecentActivityWidget loading={refreshing} />
      </div>
    </div>
  );
};