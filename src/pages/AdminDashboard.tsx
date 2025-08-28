import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  MessageSquare, 
  CreditCard, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  Globe,
  Server,
  UserPlus,
  DollarSign,
  BarChart3
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { useGatewayMonitoring } from "@/hooks/useGatewayMonitoring";
import { StatsCard } from "@/components/admin/StatsCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const AdminDashboard = () => {
  const { stats: userStats, users, loading: usersLoading } = useAdminUsers();
  const { gateways, metrics, loading: gatewaysLoading } = useGatewayMonitoring();

  if (usersLoading || gatewaysLoading) {
    return (
      <AdminLayout>
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
      </AdminLayout>
    );
  }

  const onlineGateways = gateways?.filter(g => g.status === 'online').length || 0;
  const totalGateways = gateways?.length || 0;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Advanced Header */}
        <div className="glass-card p-8 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="relative">
            <h1 className="text-4xl font-light gradient-text mb-2 flex items-center space-x-3">
              <div className="p-3 rounded-3xl bg-gradient-primary shadow-glow animate-glow">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <span>Painel Administrativo</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Visão geral completa da plataforma SMS Marketing Angola
            </p>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        {userStats && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total de Usuários"
              value={userStats.totalUsers}
              description={`${userStats.activeUsers} ativos`}
              icon={Users}
              gradient="from-blue-500 to-purple-600"
              trend={{
                value: `+${userStats.recentSignups}`,
                direction: 'up',
                label: 'este mês'
              }}
              index={0}
            />
            
            <StatsCard
              title="SMS Enviados"
              value={userStats.totalSMSSent.toLocaleString()}
              description={`${metrics?.totalDelivered.toLocaleString() || 0} entregues`}
              icon={MessageSquare}
              gradient="from-green-500 to-emerald-600"
              trend={{
                value: `${metrics?.deliveryRate.toFixed(1) || 0}%`,
                direction: (metrics?.deliveryRate || 0) >= 95 ? 'up' : 'down',
                label: 'entrega'
              }}
              index={1}
            />
            
            <StatsCard
              title="Créditos Emitidos"
              value={userStats.totalCreditsIssued.toLocaleString()}
              description={`${userStats.pendingCreditRequests} pendentes`}
              icon={Zap}
              gradient="from-orange-500 to-yellow-600"
              trend={{
                value: `${Math.round(userStats.totalCreditsIssued / userStats.totalUsers)}`,
                direction: 'up',
                label: 'por usuário'
              }}
              index={2}
            />
            
            <StatsCard
              title="Gateways SMS"
              value={`${onlineGateways}/${totalGateways}`}
              description="Online/Total"
              icon={Server}
              gradient={onlineGateways === totalGateways ? "from-green-500 to-emerald-600" : "from-red-500 to-pink-600"}
              trend={{
                value: `${Math.round((onlineGateways / totalGateways) * 100)}%`,
                direction: onlineGateways === totalGateways ? 'up' : 'down',
                label: 'online'
              }}
              index={3}
            />
          </div>
        )}

        {/* Gateway Status & Performance */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Gateway Status */}
          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="text-xl font-light gradient-text flex items-center">
                <Server className="h-5 w-5 mr-2" />
                Status dos Gateways SMS
              </CardTitle>
              <CardDescription>
                Status em tempo real dos provedores de SMS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gateways.map((gateway, index) => (
                  <div key={gateway.name} className="flex items-center justify-between p-4 glass-card rounded-2xl hover-lift">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        gateway.status === 'online' ? 'bg-green-500 shadow-glow-green' :
                        gateway.status === 'offline' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`}></div>
                      <div>
                        <p className="font-medium">{gateway.display_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {gateway.response_time ? `${gateway.response_time}ms` : 'N/A'}
                          {gateway.balance && ` • ${gateway.balance} créditos`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {gateway.is_primary && (
                        <Badge className="bg-primary text-primary-foreground">Primário</Badge>
                      )}
                      <Badge variant={
                        gateway.status === 'online' ? 'default' :
                        gateway.status === 'offline' ? 'destructive' :
                        'secondary'
                      }>
                        {gateway.status === 'online' ? 'Online' :
                         gateway.status === 'offline' ? 'Offline' : 'Testando'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="text-xl font-light gradient-text flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Performance Últimos 7 Dias
              </CardTitle>
              <CardDescription>
                Volume de SMS e taxa de entrega
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics && metrics.dailyVolume.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={metrics.dailyVolume}>
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
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Users Activity */}
        <Card className="card-futuristic">
          <CardHeader>
            <CardTitle className="text-xl font-light gradient-text flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Atividade Recente de Usuários
            </CardTitle>
            <CardDescription>
              Últimos usuários cadastrados na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.slice(0, 5).map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-4 glass-card rounded-2xl hover-lift">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-medium">
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{user.full_name || 'Sem nome'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{user.credits} créditos</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;