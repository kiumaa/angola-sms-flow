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
  Filter
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
      draft: { label: "Rascunho", variant: "secondary" as const, icon: Clock },
      scheduled: { label: "Agendada", variant: "outline" as const, icon: Calendar },
      sending: { label: "Enviando", variant: "default" as const, icon: MessageSquare },
      completed: { label: "Concluída", variant: "default" as const, icon: CheckCircle },
      cancelled: { label: "Cancelada", variant: "destructive" as const, icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
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
    // Preparar dados para exportação
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

    // Converter para CSV
    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${(row as any)[header]}"`).join(','))
    ].join('\n');

    // Download
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
          <div>
            <h1 className="text-3xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground mt-2">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <BarChart3 className="h-8 w-8" />
              <span>Relatórios</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe o desempenho das suas campanhas SMS
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={exportReport} disabled={campaigns.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Campanhas Enviadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {overallStats.totalCampaigns}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {timeRange} dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                SMS Enviados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {overallStats.totalSent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Taxa: {overallStats.successRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <XCircle className="h-4 w-4 mr-2" />
                SMS Falharam
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {overallStats.totalFailed.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {(100 - overallStats.successRate).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Créditos Usados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {overallStats.totalCreditsUsed.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Média: {Math.round(overallStats.avgRecipientsPerCampaign)} por campanha
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Performance</CardTitle>
            <CardDescription>
              Indicadores chave dos últimos {timeRange} dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  {overallStats.successRate >= 95 ? (
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  ) : overallStats.successRate >= 85 ? (
                    <BarChart3 className="h-8 w-8 text-yellow-600" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <h3 className="font-semibold">Taxa de Entrega</h3>
                <p className="text-2xl font-bold text-primary">
                  {overallStats.successRate.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {overallStats.successRate >= 95 ? "Excelente!" : 
                   overallStats.successRate >= 85 ? "Bom desempenho" : "Precisa melhorar"}
                </p>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold">Alcance Médio</h3>
                <p className="text-2xl font-bold text-primary">
                  {Math.round(overallStats.avgRecipientsPerCampaign)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Contatos por campanha
                </p>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <MessageSquare className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="font-semibold">Eficiência</h3>
                <p className="text-2xl font-bold text-primary">
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

        {/* Campaigns Details */}
        <Tabs defaultValue="campaigns">
          <TabsList>
            <TabsTrigger value="campaigns">Campanhas Detalhadas</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes das Campanhas</CardTitle>
                <CardDescription>
                  Histórico detalhado de todas as suas campanhas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma campanha encontrada</h3>
                    <p className="text-muted-foreground">
                      Não há campanhas no período selecionado.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div 
                        key={campaign.id}
                        className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{campaign.name}</h4>
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

                        <div className="grid md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Destinatários:</span>
                            <p className="font-medium">{campaign.total_recipients || 0}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Enviados:</span>
                            <p className="font-medium text-green-600">{campaign.total_sent || 0}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Falharam:</span>
                            <p className="font-medium text-red-600">{campaign.total_failed || 0}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Taxa de Sucesso:</span>
                            <p className="font-medium">
                              {getSuccessRate(campaign.total_sent, campaign.total_failed).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Créditos:</span>
                            <p className="font-medium">{campaign.credits_used || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Tendências</CardTitle>
                <CardDescription>
                  Insights sobre o comportamento das suas campanhas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Gráficos em desenvolvimento</h3>
                  <p className="text-muted-foreground">
                    Em breve teremos gráficos interativos e análises avançadas.
                  </p>
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