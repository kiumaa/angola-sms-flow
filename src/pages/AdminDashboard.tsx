import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, MessageSquare, TrendingUp, DollarSign, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

interface AdminStats {
  totalUsers: number;
  totalRevenue: number;
  totalSMSSent: number;
  activePackages: number;
  todayRegistrations: number;
  todayRevenue: number;
}

const AdminDashboard = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalRevenue: 0,
    totalSMSSent: 0,
    activePackages: 0,
    todayRegistrations: 0,
    todayRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchAdminStats();
    }
  }, [isAdmin, authLoading]);

  const fetchAdminStats = async () => {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total revenue
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount_kwanza')
        .eq('status', 'completed');

      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount_kwanza), 0) || 0;

      // Total SMS sent
      const { count: totalSMSSent } = await supabase
        .from('sms_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent');

      // Active packages
      const { count: activePackages } = await supabase
        .from('credit_packages')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Today's registrations
      const today = new Date().toISOString().split('T')[0];
      const { count: todayRegistrations } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Today's revenue
      const { data: todayTransactions } = await supabase
        .from('transactions')
        .select('amount_kwanza')
        .eq('status', 'completed')
        .gte('created_at', today);

      const todayRevenue = todayTransactions?.reduce((sum, t) => sum + Number(t.amount_kwanza), 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalRevenue,
        totalSMSSent: totalSMSSent || 0,
        activePackages: activePackages || 0,
        todayRegistrations: todayRegistrations || 0,
        todayRevenue
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground">Visão geral da plataforma SMS Marketing Angola</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.todayRegistrations} hoje
              </p>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                +{formatCurrency(stats.todayRevenue)} hoje
              </p>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SMS Enviados</CardTitle>
              <MessageSquare className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSMSSent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total de mensagens
              </p>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pacotes Ativos</CardTitle>
              <Package className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePackages}</div>
              <p className="text-xs text-muted-foreground">
                Disponíveis para venda
              </p>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12%</div>
              <p className="text-xs text-muted-foreground">
                vs. mês anterior
              </p>
            </CardContent>
          </Card>

          <Card className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <CreditCard className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24%</div>
              <p className="text-xs text-muted-foreground">
                Visitantes que compram
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;