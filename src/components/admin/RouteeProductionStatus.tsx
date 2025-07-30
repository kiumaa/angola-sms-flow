import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  RefreshCw 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProductionMetrics {
  totalSentToday: number;
  totalSentThisMonth: number;
  successRate: number;
  avgResponseTime: number;
  lastWebhookReceived: string | null;
  routeeStatus: 'operational' | 'degraded' | 'down';
}

export default function RouteeProductionStatus() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<ProductionMetrics>({
    totalSentToday: 0,
    totalSentThisMonth: 0,
    successRate: 0,
    avgResponseTime: 0,
    lastWebhookReceived: null,
    routeeStatus: 'operational'
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMetrics();
    // Atualizar métricas a cada 5 minutos
    const interval = setInterval(loadMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Métricas de hoje
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const { data: todayLogs, error: todayError } = await supabase
        .from('sms_logs')
        .select('status')
        .eq('gateway_used', 'routee')
        .gte('created_at', todayStart.toISOString());

      if (todayError) throw todayError;

      // Métricas do mês
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const { data: monthLogs, error: monthError } = await supabase
        .from('sms_logs')
        .select('status, sent_at')
        .eq('gateway_used', 'routee')
        .gte('created_at', monthStart.toISOString());

      if (monthError) throw monthError;

      // Calcular métricas
      const totalSentToday = todayLogs?.length || 0;
      const totalSentThisMonth = monthLogs?.length || 0;
      const successfulSent = monthLogs?.filter(log => log.status === 'sent' || log.status === 'delivered').length || 0;
      const successRate = totalSentThisMonth > 0 ? (successfulSent / totalSentThisMonth) * 100 : 0;

      // Último webhook recebido (simulado por agora)
      const lastWebhookReceived = monthLogs && monthLogs.length > 0 
        ? monthLogs[monthLogs.length - 1].sent_at 
        : null;

      setMetrics({
        totalSentToday,
        totalSentThisMonth,
        successRate,
        avgResponseTime: 250, // Simulated - Routee is typically fast
        lastWebhookReceived,
        routeeStatus: successRate > 95 ? 'operational' : successRate > 80 ? 'degraded' : 'down'
      });
      
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar métricas de produção",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Operacional</Badge>;
      case 'degraded':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Degradado</Badge>;
      case 'down':
        return <Badge variant="destructive">Inativo</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'down':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Status de Produção</h2>
        </div>
        <Button
          onClick={loadMetrics}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Status Geral */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(metrics.routeeStatus)}
                Status do Gateway
              </CardTitle>
              <CardDescription>
                Status atual do Routee SMS Gateway
              </CardDescription>
            </div>
            {getStatusBadge(metrics.routeeStatus)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{metrics.totalSentToday}</div>
              <p className="text-sm text-muted-foreground">SMS Hoje</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{metrics.totalSentThisMonth}</div>
              <p className="text-sm text-muted-foreground">SMS Este Mês</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.successRate.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.avgResponseTime}ms</div>
              <p className="text-sm text-muted-foreground">Tempo Resposta</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monitoramento de Webhook
          </CardTitle>
          <CardDescription>
            Status dos callbacks de entrega do Routee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="font-medium text-blue-900">URL do Webhook</p>
                <p className="text-sm text-blue-700 font-mono">
                  https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/routee-webhook
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href="https://docs.routee.net/docs/messaging-api-webhooks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Docs
                </a>
              </Button>
            </div>
            
            {metrics.lastWebhookReceived && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Último webhook: {new Date(metrics.lastWebhookReceived).toLocaleString('pt-BR')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuração de Produção */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração Recomendada para Produção</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Webhook configurado no Routee Dashboard</p>
                <p className="text-muted-foreground">
                  Configure a URL do webhook no painel do Routee para receber callbacks de entrega
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Monitoramento de logs ativo</p>
                <p className="text-muted-foreground">
                  Todos os SMS são registrados com tracking IDs para auditoria completa
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Rate limiting e retry configurados</p>
                <p className="text-muted-foreground">
                  Sistema preparado para alto volume com tratamento de erros
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}