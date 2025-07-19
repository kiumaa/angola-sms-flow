import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  Zap
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface CampaignStats {
  id: string;
  name: string;
  total_recipients: number;
  total_sent: number;
  total_failed: number;
  credits_used: number;
  status: string;
  created_at: string;
}

interface OverallStats {
  totalCampaigns: number;
  totalSent: number;
  totalFailed: number;
  totalCreditsUsed: number;
  successRate: number;
  avgRecipientsPerCampaign: number;
}

const Reports = () => {
  const [campaigns, setCampaigns] = useState<CampaignStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalCampaigns: 0,
    totalSent: 0,
    totalFailed: 0,
    totalCreditsUsed: 0,
    successRate: 0,
    avgRecipientsPerCampaign: 0
  });

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user, timeRange]);

  const fetchReports = async () => {
    try {
      const daysAgo = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('sms_campaigns')
        .select('id, name, total_recipients, total_sent, total_failed, credits_used, status, created_at')
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCampaigns(data || []);
      calculateOverallStats(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatórios.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallStats = (campaignData: CampaignStats[]) => {
    const completedCampaigns = campaignData.filter(c => c.status === 'completed');
    
    const totalSent = completedCampaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0);
    const totalFailed = completedCampaigns.reduce((sum, c) => sum + (c.total_failed || 0), 0);
    const totalCreditsUsed = completedCampaigns.reduce((sum, c) => sum + (c.credits_used || 0), 0);
    const totalMessages = totalSent + totalFailed;
    
    setOverallStats({
      totalCampaigns: campaignData.length,
      totalSent,
      totalFailed,
      totalCreditsUsed,
      successRate: totalMessages > 0 ? (totalSent / totalMessages) * 100 : 0,
      avgRecipientsPerCampaign: completedCampaigns.length > 0 ? 
        completedCampaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0) / completedCampaigns.length : 0
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Rascunho", variant: "secondary" as const, icon: Clock, color: "bg-gray-500" },
      scheduled: { label: "Agendada", variant: "outline" as const, icon: Calendar, color: "bg-blue-500" },
      sending: { label: "Enviando", variant: "default" as const, icon: MessageSquare, color: "bg-yellow-500" },
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

  const getSuccessRate = (sent: number, failed: number) => {
    const total = sent + failed;
    if (total === 0) return 0;
    return (sent / total) * 100;
  };

  const exportReport = () => {
    const csvData = campaigns.map(campaign => ({
      'Nome da Campanha': campaign.name,
      'Status': campaign.status,
      'Destinatários': campaign.total_recipients,
      'Enviados': campaign.total_sent,
      'Falharam': campaign.total_failed,
      'Taxa de Sucesso': `${getSuccessRate(campaign.total_sent, campaign.total_failed).toFixed(1)}%`,
      'Créditos Usados': campaign.credits_used,
      'Data de Criação': new Date(campaign.created_at).toLocaleDateString('pt-AO')
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${(row as any)[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-sms-${timeRange}-dias.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Relatório exportado",
      description: "O arquivo CSV foi baixado com sucesso.",
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="glass-card p-8 animate-float">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-3xl bg-gradient-primary shadow-glow animate-glow">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-light gradient-text">Relatórios</h1>
                <p className="text-muted-foreground mt-1">Carregando analytics avançados...</p>
              </div>
            </div>
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
              <Select value={timeRange} onValueChange={setTimeRange}>
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
                onClick={exportReport} 
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Campanhas Enviadas",
              value: overallStats.totalCampaigns,
              description: `${timeRange} dias`,
              icon: MessageSquare,
              gradient: "from-blue-500 to-purple-600",
              trend: "+15%"
            },
            {
              title: "SMS Entregues",
              value: overallStats.totalSent.toLocaleString(),
              description: `Taxa: ${overallStats.successRate.toFixed(1)}%`,
              icon: CheckCircle,
              gradient: "from-green-500 to-emerald-600",
              trend: "+8%"
            },
            {
              title: "Taxa de Falhas",
              value: `${(100 - overallStats.successRate).toFixed(1)}%`,
              description: `${overallStats.totalFailed.toLocaleString()} falharam`,
              icon: XCircle,
              gradient: "from-red-500 to-pink-600",
              trend: "-2%"
            },
            {
              title: "Créditos Utilizados",
              value: overallStats.totalCreditsUsed.toLocaleString(),
              description: `Média: ${Math.round(overallStats.avgRecipientsPerCampaign)} por campanha`,
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
                <div className="flex items-center text-xs text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.trend} vs período anterior
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Dashboard */}
        <Card className="card-futuristic">
          <CardHeader>
            <CardTitle className="text-2xl font-light gradient-text">Dashboard de Performance</CardTitle>
            <CardDescription className="text-lg">
              Indicadores chave dos últimos {timeRange} dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 glass-card rounded-3xl hover-lift group">
                <div className="flex items-center justify-center mb-4">
                  {overallStats.successRate >= 95 ? (
                    <div className="p-4 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-glow group-hover:scale-110 transition-all duration-300">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                  ) : overallStats.successRate >= 85 ? (
                    <div className="p-4 rounded-3xl bg-gradient-to-br from-yellow-500 to-orange-600 shadow-glow group-hover:scale-110 transition-all duration-300">
                      <BarChart3 className="h-8 w-8 text-white" />
                    </div>
                  ) : (
                    <div className="p-4 rounded-3xl bg-gradient-to-br from-red-500 to-pink-600 shadow-glow group-hover:scale-110 transition-all duration-300">
                      <TrendingDown className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-lg gradient-text mb-2">Taxa de Entrega</h3>
                <p className="text-3xl font-light gradient-text mb-2">
                  {overallStats.successRate.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {overallStats.successRate >= 95 ? "🎉 Excelente performance!" : 
                   overallStats.successRate >= 85 ? "👍 Bom desempenho" : "⚠️ Precisa otimizar"}
                </p>
              </div>

              <div className="text-center p-6 glass-card rounded-3xl hover-lift group">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 rounded-3xl bg-gradient-primary shadow-glow group-hover:scale-110 transition-all duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg gradient-text mb-2">Alcance Médio</h3>
                <p className="text-3xl font-light gradient-text mb-2">
                  {Math.round(overallStats.avgRecipientsPerCampaign)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Contatos por campanha
                </p>
              </div>

              <div className="text-center p-6 glass-card rounded-3xl hover-lift group">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-glow group-hover:scale-110 transition-all duration-300">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg gradient-text mb-2">Eficiência</h3>
                <p className="text-3xl font-light gradient-text mb-2">
                  {overallStats.totalCreditsUsed > 0 ? 
                    (overallStats.totalSent / overallStats.totalCreditsUsed * 100).toFixed(1) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">
                  SMS enviados / créditos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Campaigns Details */}
        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="glass-card rounded-2xl p-1">
            <TabsTrigger value="campaigns" className="rounded-xl">Campanhas Detalhadas</TabsTrigger>
            <TabsTrigger value="trends" className="rounded-xl">Tendências & Analytics</TabsTrigger>
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

                        <div className="grid md:grid-cols-5 gap-6 text-center">
                          <div className="p-4 glass-card rounded-2xl">
                            <span className="text-sm text-muted-foreground block mb-1">Destinatários</span>
                            <p className="font-semibold text-xl gradient-text">{campaign.total_recipients || 0}</p>
                          </div>
                          <div className="p-4 glass-card rounded-2xl">
                            <span className="text-sm text-muted-foreground block mb-1">Enviados</span>
                            <p className="font-semibold text-xl text-green-500">{campaign.total_sent || 0}</p>
                          </div>
                          <div className="p-4 glass-card rounded-2xl">
                            <span className="text-sm text-muted-foreground block mb-1">Falharam</span>
                            <p className="font-semibold text-xl text-red-500">{campaign.total_failed || 0}</p>
                          </div>
                          <div className="p-4 glass-card rounded-2xl">
                            <span className="text-sm text-muted-foreground block mb-1">Taxa de Sucesso</span>
                            <p className="font-semibold text-xl gradient-text">
                              {getSuccessRate(campaign.total_sent, campaign.total_failed).toFixed(1)}%
                            </p>
                          </div>
                          <div className="p-4 glass-card rounded-2xl">
                            <span className="text-sm text-muted-foreground block mb-1">Créditos</span>
                            <p className="font-semibold text-xl gradient-text">{campaign.credits_used || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="mt-6">
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle className="text-2xl font-light gradient-text">Analytics Avançados</CardTitle>
                <CardDescription className="text-lg">
                  Insights profundos sobre o comportamento das suas campanhas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16">
                  <div className="p-6 rounded-3xl bg-gradient-primary/10 w-fit mx-auto mb-6">
                    <BarChart3 className="h-16 w-16 text-primary mx-auto animate-float" />
                  </div>
                  <h3 className="text-2xl font-light gradient-text mb-4">Gráficos Interativos em Desenvolvimento</h3>
                  <p className="text-muted-foreground text-lg mb-8">
                    Em breve teremos gráficos dinâmicos, heatmaps de performance e análises preditivas com IA.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Badge className="bg-blue-500 text-white px-4 py-2">📊 Charts Dinâmicos</Badge>
                    <Badge className="bg-purple-500 text-white px-4 py-2">🤖 Analytics com IA</Badge>
                    <Badge className="bg-green-500 text-white px-4 py-2">🎯 Segmentação Avançada</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;