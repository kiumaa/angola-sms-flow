import { useCampaignMonitoring } from "@/hooks/useCampaignMonitoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Pause, 
  Play, 
  StopCircle,
  TrendingUp,
  Users,
  CreditCard
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const CampaignMonitoringDashboard = () => {
  const { 
    campaigns, 
    metrics, 
    loading, 
    pauseCampaign, 
    resumeCampaign, 
    cancelCampaign 
  } = useCampaignMonitoring();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'canceled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'sending':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      sending: "secondary", 
      failed: "destructive",
      canceled: "destructive",
      paused: "outline",
      queued: "outline"
    };

    const labels: Record<string, string> = {
      completed: "Concluída",
      sending: "Enviando",
      failed: "Falhou",
      canceled: "Cancelada",
      paused: "Pausada",
      queued: "Na Fila"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {getStatusIcon(status)}
        <span className="ml-1">{labels[status] || status}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Campanhas Ativas</p>
                  <p className="text-2xl font-bold">{metrics.activeCampaigns}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Concluídas Hoje</p>
                  <p className="text-2xl font-bold">{metrics.completedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Mensagens Enviadas</p>
                  <p className="text-2xl font-bold">{metrics.totalMessagesSent.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Taxa de Entrega</p>
                  <p className="text-2xl font-bold">{metrics.averageDeliveryRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Campanhas em Progresso</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma campanha ativa encontrada.
            </p>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => {
                const totalProcessed = campaign.progress.sent + campaign.progress.delivered + campaign.progress.failed;
                const progressPercentage = campaign.total_targets > 0 
                  ? (totalProcessed / campaign.total_targets) * 100 
                  : 0;

                return (
                  <div key={campaign.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Criada {formatDistanceToNow(new Date(campaign.timeline.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(campaign.status)}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>{totalProcessed} / {campaign.total_targets}</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Entregue: {campaign.progress.delivered}</span>
                        <span>Falharam: {campaign.progress.failed}</span>
                        <span>Taxa: {campaign.stats.delivery_rate.toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-medium text-blue-600">{campaign.progress.sent}</p>
                        <p className="text-muted-foreground">Enviadas</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-green-600">{campaign.progress.delivered}</p>
                        <p className="text-muted-foreground">Entregues</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-purple-600">{campaign.stats.credits_spent}</p>
                        <p className="text-muted-foreground">Créditos</p>
                      </div>
                    </div>

                    {/* Actions */}
                    {['sending', 'paused', 'queued'].includes(campaign.status) && (
                      <div className="flex space-x-2 pt-2">
                        {campaign.status === 'sending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pauseCampaign(campaign.id)}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pausar
                          </Button>
                        )}
                        
                        {campaign.status === 'paused' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resumeCampaign(campaign.id)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Retomar
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelCampaign(campaign.id)}
                        >
                          <StopCircle className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {metrics?.recentActivity && metrics.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Atividade Recente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{activity.campaign_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.targets_processed} alvos processados
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(activity.status)}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CampaignMonitoringDashboard;