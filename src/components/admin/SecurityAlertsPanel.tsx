import { useState } from 'react';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, AlertTriangle, X, Eye, RefreshCw, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SecurityAlertsPanel() {
  const { alerts, loading, dismissAlert, markAsRead, refetch } = useSecurityMonitoring();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showDismissed, setShowDismissed] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getPatternDescription = (pattern: string) => {
    switch (pattern) {
      case 'rapid_role_changes':
        return 'Mudanças de função muito rápidas';
      case 'after_hours_activity':
        return 'Atividade fora do horário comercial';
      case 'multiple_ips':
        return 'Múltiplos endereços IP';
      case 'privilege_escalation':
        return 'Tentativa de escalação de privilégios';
      case 'rate_limit_violations':
        return 'Violações de limite de taxa';
      case 'failed_auth_attempts':
        return 'Tentativas de autenticação falhadas';
      default:
        return pattern;
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesType = typeFilter === 'all' || alert.type === typeFilter;
    
    return matchesSearch && matchesSeverity && matchesType;
  });

  const alertTypes = [...new Set(alerts.map(alert => alert.type))];
  const criticalAlerts = filteredAlerts.filter(alert => alert.severity === 'critical');
  const highAlerts = filteredAlerts.filter(alert => alert.severity === 'high');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Central de Alertas de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Central de Alertas de Segurança
            </div>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </CardTitle>
          <CardDescription>
            Gerencie alertas de segurança avançados com filtragem e análise de padrões
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Métricas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-destructive/5">
              <div className="p-2 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <div className="font-semibold text-lg">{criticalAlerts.length}</div>
                <div className="text-sm text-muted-foreground">Críticos</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-orange-50">
              <div className="p-2 bg-orange-100 rounded-full">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="font-semibold text-lg">{highAlerts.length}</div>
                <div className="text-sm text-muted-foreground">Altos</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="p-2 bg-blue-100 rounded-full">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-lg">{filteredAlerts.length}</div>
                <div className="text-sm text-muted-foreground">Filtrados</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="p-2 bg-green-100 rounded-full">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-lg">{alerts.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar alertas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Severidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as severidades</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="high">Alto</SelectItem>
                <SelectItem value="medium">Médio</SelectItem>
                <SelectItem value="low">Baixo</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {alertTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredAlerts.length === 0 ? (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                {searchTerm || severityFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Nenhum alerta encontrado com os filtros aplicados.'
                  : 'Nenhum alerta de segurança detectado. O sistema está funcionando normalmente.'
                }
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  Alertas {filteredAlerts.length !== alerts.length && `(${filteredAlerts.length} de ${alerts.length})`}
                </h3>
                {(criticalAlerts.length > 0 || highAlerts.length > 0) && (
                  <Badge variant="destructive" className="animate-pulse">
                    {criticalAlerts.length + highAlerts.length} Urgente{criticalAlerts.length + highAlerts.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              
              {filteredAlerts.slice(0, 20).map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-start justify-between p-4 border rounded-lg transition-colors",
                    alert.severity === 'critical' && "border-destructive bg-destructive/5",
                    alert.severity === 'high' && "border-orange-300 bg-orange-50",
                    alert.severity === 'medium' && "border-yellow-300 bg-yellow-50"
                  )}
                >
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="space-y-1 flex-1">
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString('pt-BR')}
                      </div>
                      
                      {/* Metadados adicionais */}
                      {alert.metadata && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {alert.metadata.pattern && (
                            <Badge variant="outline" className="text-xs">
                              {getPatternDescription(alert.metadata.pattern)}
                            </Badge>
                          )}
                          {alert.metadata.riskScore && (
                            <Badge variant="outline" className="text-xs">
                              Risco: {alert.metadata.riskScore}
                            </Badge>
                          )}
                          {alert.metadata.count && (
                            <Badge variant="outline" className="text-xs">
                              Ocorrências: {alert.metadata.count}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={getSeverityColor(alert.severity) as any}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(alert.id)}
                      title="Marcar como lido"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                      title="Dispensar alerta"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredAlerts.length > 20 && (
                <div className="text-center pt-4">
                  <div className="text-sm text-muted-foreground mb-2">
                    Mostrando 20 de {filteredAlerts.length} alertas
                  </div>
                  <Button variant="outline" onClick={refetch}>
                    Ver Todos os Alertas
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}