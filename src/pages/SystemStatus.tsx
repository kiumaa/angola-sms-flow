import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Zap, 
  Shield, 
  Database,
  Send,
  Users,
  CreditCard,
  HardDrive
} from "lucide-react";

const SystemStatusPage = () => {
  // This would be populated from your monitoring system
  const systemStatus = {
    overall: 'operational', // operational, degraded, major_outage
    components: [
      {
        name: 'API',
        status: 'operational',
        description: 'All API endpoints responding normally'
      },
      {
        name: 'Database',
        status: 'operational', 
        description: 'Supabase PostgreSQL running smoothly'
      },
      {
        name: 'Authentication',
        status: 'operational',
        description: 'User authentication and registration working'
      },
      {
        name: 'SMS Gateways',
        status: 'degraded',
        description: 'BulkSMS experiencing intermittent delays'
      },
      {
        name: 'File Storage',
        status: 'operational',
        description: 'File uploads and downloads working normally'
      },
      {
        name: 'Background Jobs',
        status: 'operational',
        description: 'Quick send jobs and background workers running'
      }
    ],
    incidents: [
      {
        title: 'SMS Gateway Performance Issues',
        status: 'investigating',
        description: 'We are investigating reports of delayed SMS delivery through our BulkSMS integration.',
        time: '2025-01-18 14:30 UTC',
        updates: [
          {
            time: '14:45 UTC',
            message: 'Issue identified with BulkSMS rate limiting. Implementing workaround.'
          },
          {
            time: '14:30 UTC', 
            message: 'Investigating reports of delayed SMS delivery.'
          }
        ]
      }
    ],
    metrics: {
      uptime: '99.95%',
      responseTime: '145ms',
      errorRate: '0.02%'
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'major_outage':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      operational: "default",
      degraded: "secondary",
      major_outage: "destructive"
    };

    const labels: Record<string, string> = {
      operational: "Operacional",
      degraded: "Degradado", 
      major_outage: "Interrompido"
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getComponentIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'api':
        return <Zap className="h-5 w-5" />;
      case 'database':
        return <Database className="h-5 w-5" />;
      case 'authentication':
        return <Shield className="h-5 w-5" />;
      case 'sms gateways':
        return <Send className="h-5 w-5" />;
      case 'file storage':
        return <HardDrive className="h-5 w-5" />;
      case 'background jobs':
        return <Users className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">SMS Marketing Angola - Status</h1>
          <div className="flex items-center justify-center space-x-2 mb-4">
            {getStatusIcon(systemStatus.overall)}
            <span className="text-xl font-medium">
              {systemStatus.overall === 'operational' ? 'Todos os sistemas operacionais' : 'Problemas detectados'}
            </span>
          </div>
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Overall Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {systemStatus.metrics.uptime}
              </div>
              <p className="text-muted-foreground">Uptime (30 dias)</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {systemStatus.metrics.responseTime}
              </div>
              <p className="text-muted-foreground">Tempo de Resposta</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {systemStatus.metrics.errorRate}
              </div>
              <p className="text-muted-foreground">Taxa de Erro</p>
            </CardContent>
          </Card>
        </div>

        {/* Current Incidents */}
        {systemStatus.incidents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span>Incidentes Ativos</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemStatus.incidents.map((incident, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{incident.title}</h4>
                        <Badge variant="outline">{incident.status}</Badge>
                      </div>
                      <p className="text-sm">{incident.description}</p>
                      <p className="text-xs text-muted-foreground">{incident.time}</p>
                      
                      {incident.updates.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h5 className="text-sm font-medium">Atualizações:</h5>
                          {incident.updates.map((update, updateIndex) => (
                            <div key={updateIndex} className="text-xs bg-muted p-2 rounded">
                              <span className="font-medium">{update.time}:</span> {update.message}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Components Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Componentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemStatus.components.map((component, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getComponentIcon(component.name)}
                    <div>
                      <h4 className="font-medium">{component.name}</h4>
                      <p className="text-sm text-muted-foreground">{component.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(component.status)}
                    {getStatusBadge(component.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subscription for Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Fique Informado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Inscreva-se para receber notificações sobre interrupções e manutenções programadas.
            </p>
            <div className="flex space-x-2">
              <Button variant="outline">
                Inscrever-se via Email
              </Button>
              <Button variant="outline">
                Seguir no Twitter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-muted-foreground text-sm">
          <p>Esta página é atualizada automaticamente a cada 30 segundos.</p>
          <p className="mt-2">
            Para suporte, entre em contato conosco em{" "}
            <a href="mailto:suporte@smsmarketing.ao" className="text-primary hover:underline">
              suporte@smsmarketing.ao
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusPage;