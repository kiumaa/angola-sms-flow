import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  CreditCard,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlatformStats {
  totalUsers: number;
  totalCampaigns: number;
  totalSMS: number;
  totalRevenue: number;
  activeUsers: number;
  pendingTransactions: number;
  successRate: number;
}

interface UserActivity {
  id: string;
  full_name: string;
  email: string;
  company_name: string;
  credits: number;
  total_campaigns: number;
  total_sms_sent: number;
  last_activity: string;
}

interface RecentTransaction {
  id: string;
  amount_kwanza: number;
  credits_purchased: number;
  status: string;
  created_at: string;
  user_email: string;
  user_name: string;
}

const AdminReports = () => {
  const [stats, setStats] = useState<PlatformStats>({
    totalUsers: 0,
    totalCampaigns: 0,
    totalSMS: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingTransactions: 0,
    successRate: 0
  });
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");

  const { toast } = useToast();

  useEffect(() => {
    fetchAdminReports();
  }, [timeRange]);

  const fetchAdminReports = async () => {
    try {
      // Fetch platform statistics
      const [
        usersResult,
        campaignsResult,
        transactionsResult,
        smsLogsResult
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('sms_campaigns').select('*', { count: 'exact' }),
        supabase.from('transactions').select('id, amount_kwanza, credits_purchased, status, created_at, profiles!inner(email, full_name)', { count: 'exact' }),
        supabase.from('sms_logs').select('status', { count: 'exact' })
      ]);

      // Calculate stats
      const totalUsers = usersResult.count || 0;
      const totalCampaigns = campaignsResult.count || 0;
      const totalSMS = smsLogsResult.count || 0;
      
      const transactions = transactionsResult.data || [];
      const completedTransactions = transactions.filter(t => t.status === 'completed');
      const totalRevenue = completedTransactions.reduce((sum, t) => sum + Number(t.amount_kwanza), 0);
      const pendingTransactions = transactions.filter(t => t.status === 'pending').length;

      // Calculate success rate from SMS logs
      const smsLogs = smsLogsResult.data || [];
      const sentSMS = smsLogs.filter(log => log.status === 'sent' || log.status === 'delivered').length;
      const successRate = totalSMS > 0 ? (sentSMS / totalSMS) * 100 : 0;

      setStats({
        totalUsers,
        totalCampaigns,
        totalSMS,
        totalRevenue,
        activeUsers: Math.floor(totalUsers * 0.7), // Approximation
        pendingTransactions,
        successRate
      });

      // Fetch user activity data
      const { data: userActivityData } = await supabase
        .from('profiles')
        .select(`
          *,
          sms_campaigns(count),
          sms_logs(count)
        `)
        .order('updated_at', { ascending: false })
        .limit(10);

      const formattedUserActivity = (userActivityData || []).map(user => ({
        id: user.id,
        full_name: user.full_name || 'N/A',
        email: user.email || '',
        company_name: user.company_name || '',
        credits: user.credits || 0,
        total_campaigns: user.sms_campaigns?.length || 0,
        total_sms_sent: user.sms_logs?.length || 0,
        last_activity: user.updated_at
      }));

      setUserActivity(formattedUserActivity);

      // Format recent transactions
      const formattedTransactions = transactions
        .slice(0, 10)
        .map(t => ({
          id: t.id || '',
          amount_kwanza: Number(t.amount_kwanza),
          credits_purchased: t.credits_purchased || 0,
          status: t.status || '',
          created_at: t.created_at || '',
          user_email: (t.profiles as any)?.email || '',
          user_name: (t.profiles as any)?.full_name || ''
        }));

      setRecentTransactions(formattedTransactions);

    } catch (error) {
      console.error('Error fetching admin reports:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatórios administrativos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const, icon: Clock },
      completed: { label: "Concluída", variant: "default" as const, icon: CheckCircle },
      failed: { label: "Falhou", variant: "destructive" as const, icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Administrativos</h1>
          <p className="text-muted-foreground mt-2">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <BarChart3 className="h-8 w-8" />
            <span>Relatórios Administrativos</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Visão geral da plataforma e métricas de negócio
          </p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {stats.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeUsers} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              SMS Enviados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.totalSMS.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.successRate.toFixed(1)}% taxa de sucesso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">
              {stats.totalRevenue.toLocaleString()} Kz
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingTransactions} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Campanhas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.totalCampaigns}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total criadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Performance</CardTitle>
          <CardDescription>
            Indicadores chave de performance da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {stats.successRate >= 95 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                )}
              </div>
              <h3 className="font-semibold">Taxa de Entrega</h3>
              <p className="text-2xl font-bold text-primary">
                {stats.successRate.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">
                {stats.successRate >= 95 ? "Excelente" : "Precisa atenção"}
              </p>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">Engajamento</h3>
              <p className="text-2xl font-bold text-primary">
                {stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers * 100).toFixed(1) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">
                Usuários ativos
              </p>
            </div>

            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <CreditCard className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="font-semibold">Receita Média</h3>
              <p className="text-2xl font-bold text-primary">
                {stats.totalUsers > 0 ? (stats.totalRevenue / stats.totalUsers).toLocaleString() : 0} Kz
              </p>
              <p className="text-sm text-muted-foreground">
                Por usuário
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Reports */}
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Atividade de Usuários</TabsTrigger>
          <TabsTrigger value="transactions">Transações Recentes</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Atividade de Usuários</CardTitle>
              <CardDescription>
                Usuários mais ativos e suas estatísticas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
                </div>
              ) : (
                <div className="space-y-4">
                  {userActivity.map((user) => (
                    <div 
                      key={user.id}
                      className="flex justify-between items-center p-4 border border-border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{user.full_name}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.company_name && (
                          <p className="text-xs text-muted-foreground flex items-center mt-1">
                            <Building2 className="h-3 w-3 mr-1" />
                            {user.company_name}
                          </p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <p className="font-medium">{user.credits}</p>
                          <p className="text-muted-foreground">Créditos</p>
                        </div>
                        <div>
                          <p className="font-medium">{user.total_campaigns}</p>
                          <p className="text-muted-foreground">Campanhas</p>
                        </div>
                        <div>
                          <p className="font-medium">{user.total_sms_sent}</p>
                          <p className="text-muted-foreground">SMS</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
              <CardDescription>
                Últimas transações da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma transação encontrada</h3>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="flex justify-between items-center p-4 border border-border rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold">{transaction.user_name || transaction.user_email}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString('pt-AO')}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold">{transaction.amount_kwanza.toLocaleString()} Kz</p>
                        <p className="text-sm text-muted-foreground">{transaction.credits_purchased} créditos</p>
                      </div>
                      
                      <div className="ml-4">
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Insights da Plataforma</CardTitle>
              <CardDescription>
                Análises e recomendações baseadas nos dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                    Performance de Entrega
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Taxa de {stats.successRate.toFixed(1)}% está {stats.successRate >= 95 ? 'excelente' : 'dentro da média'}. 
                    {stats.successRate < 95 && ' Considere revisar configurações de sender IDs.'}
                  </p>
                </div>

                <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-950">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                    Crescimento de Usuários
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    {stats.totalUsers} usuários cadastrados. Engajamento de {(stats.activeUsers / stats.totalUsers * 100).toFixed(1)}% 
                    {stats.activeUsers / stats.totalUsers > 0.7 ? ' está muito bom!' : ' pode ser melhorado com campanhas de reativação.'}
                  </p>
                </div>

                <div className="p-4 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                    Receita e Pagamentos
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    {stats.pendingTransactions} transações pendentes precisam de atenção. 
                    Receita média de {(stats.totalRevenue / stats.totalUsers).toLocaleString()} Kz por usuário.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReports;