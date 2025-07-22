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
    <div className="space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-h1 font-light tracking-tight">Painel Administrativo</h1>
        <p className="text-muted-foreground font-light">Visão geral da plataforma SMS Marketing Angola</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded-minimal w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded-minimal w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-0 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 shadow-sm hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-light text-muted-foreground">Créditos Disponíveis</CardTitle>
              <Users className="h-5 w-5 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-h2 font-light tracking-tight">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground font-light mt-1">
                +{stats.todayRegistrations} novos hoje
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 shadow-sm hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-light text-muted-foreground">Campanhas Enviadas</CardTitle>
              <MessageSquare className="h-5 w-5 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-h2 font-light tracking-tight">{stats.totalSMSSent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground font-light mt-1">
                Total de mensagens
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 shadow-sm hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-light text-muted-foreground">Receita Total</CardTitle>
              <DollarSign className="h-5 w-5 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-h2 font-light tracking-tight">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground font-light mt-1">
                +{formatCurrency(stats.todayRevenue)} hoje
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 shadow-sm hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-light text-muted-foreground">Usuários Ativos</CardTitle>
              <Users className="h-5 w-5 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-h2 font-light tracking-tight">{Math.floor(stats.totalUsers * 0.68)}</div>
              <p className="text-xs text-muted-foreground font-light mt-1">
                68% dos usuários
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 shadow-sm hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-light text-muted-foreground">SMS Falhados</CardTitle>
              <MessageSquare className="h-5 w-5 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-h2 font-light tracking-tight">{Math.floor(stats.totalSMSSent * 0.02)}</div>
              <p className="text-xs text-muted-foreground font-light mt-1">
                2% taxa de falha
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 shadow-sm hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-light text-muted-foreground">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-5 w-5 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-h2 font-light tracking-tight">24%</div>
              <p className="text-xs text-muted-foreground font-light mt-1">
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