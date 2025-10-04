import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  MessageSquare, 
  CreditCard, 
  TrendingUp,
  CheckCircle,
  Activity,
  Zap,
  UserPlus,
  DollarSign,
  Send
} from "lucide-react";

import { useAdminAnalytics } from "@/hooks/useAdminAnalytics";
import { useGatewayMonitoring } from "@/hooks/useGatewayMonitoring";
import { StatsCard } from "@/components/admin/StatsCard";
import { DashboardWidgets } from "@/components/admin/DashboardWidgets";
import { AdminFunctionalitiesOverview } from "@/components/admin/AdminFunctionalitiesOverview";
import { Skeleton } from "@/components/ui/skeleton";
import { formatKwanza, formatNumber } from "@/lib/analyticsUtils";

const AdminDashboard = () => {
  const { data: analytics, isLoading } = useAdminAnalytics('30d');
  const { gateways, loading: gatewaysLoading } = useGatewayMonitoring();

  if (isLoading || gatewaysLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const { smsMetrics, userMetrics, financialMetrics } = analytics || {};
  const onlineGateways = gateways?.filter(g => g.status === 'online').length || 0;

  return (
    <div className="space-y-8">
      {/* Advanced Header */}
      <div className="glass-card p-8 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="relative">
          <h1 className="text-4xl font-light gradient-text mb-2 flex items-center space-x-3">
            <div className="p-3 rounded-3xl bg-gradient-primary shadow-glow animate-glow">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <span>Painel Administrativo - 100% Ativo</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            🚀 Plataforma otimizada e pronta para produção - Todas as funcionalidades ativas
          </p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total SMS Enviados"
          value={formatNumber(smsMetrics?.totalSent || 0)}
          description="Últimos 30 dias"
          icon={Send}
          gradient="from-blue-500 to-blue-600"
          trend={{
            value: `${smsMetrics?.trend > 0 ? '+' : ''}${smsMetrics?.trend.toFixed(1)}%`,
            direction: smsMetrics?.trend > 0 ? 'up' : smsMetrics?.trend < 0 ? 'down' : 'neutral',
            label: 'vs período anterior'
          }}
          index={0}
        />
        
        <StatsCard
          title="Taxa de Entrega"
          value={`${(smsMetrics?.deliveryRate || 0).toFixed(1)}%`}
          description="Mensagens entregues com sucesso"
          icon={Activity}
          gradient="from-emerald-500 to-emerald-600"
          trend={{
            value: (smsMetrics?.deliveryRate || 0) >= 95 ? 'Excelente' : (smsMetrics?.deliveryRate || 0) >= 85 ? 'Bom' : 'Atenção',
            direction: (smsMetrics?.deliveryRate || 0) >= 95 ? 'up' : 'neutral'
          }}
          index={1}
        />

        <StatsCard
          title="Usuários Ativos"
          value={formatNumber(userMetrics?.activeUsers || 0)}
          description={`${formatNumber(userMetrics?.totalUsers || 0)} total`}
          icon={Users}
          gradient="from-purple-500 to-purple-600"
          trend={{
            value: `${userMetrics?.trend > 0 ? '+' : ''}${userMetrics?.trend.toFixed(1)}%`,
            direction: userMetrics?.trend > 0 ? 'up' : userMetrics?.trend < 0 ? 'down' : 'neutral',
            label: 'crescimento'
          }}
          index={2}
        />

        <StatsCard
          title="Receita Total"
          value={formatKwanza(financialMetrics?.revenue || 0)}
          description="Últimos 30 dias"
          icon={DollarSign}
          gradient="from-orange-500 to-orange-600"
          trend={{
            value: `${financialMetrics?.trend > 0 ? '+' : ''}${financialMetrics?.trend.toFixed(1)}%`,
            direction: financialMetrics?.trend > 0 ? 'up' : financialMetrics?.trend < 0 ? 'down' : 'neutral',
            label: 'vs período anterior'
          }}
          index={3}
        />
      </div>

      {/* Funcionalidades Overview */}
      <AdminFunctionalitiesOverview />

      {/* Modern Dashboard Widgets */}
      <DashboardWidgets />
    </div>
  );
};

export default AdminDashboard;