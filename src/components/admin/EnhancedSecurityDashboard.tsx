import { useState } from 'react';
import { useSecurityConfiguration } from '@/hooks/useSecurityConfiguration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecurityDashboard } from './SecurityDashboard';
import { SecurityAlertsPanel } from './SecurityAlertsPanel';
import { Shield, AlertTriangle, CheckCircle, RefreshCw, TrendingUp, Database, Lock, Eye, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EnhancedSecurityDashboard() {
  const { configuration, loading, error, refetch, getSecurityStatus, recommendations } = useSecurityConfiguration();
  const [activeTab, setActiveTab] = useState('overview');

  const securityStatus = getSecurityStatus || { status: 'unknown', color: 'gray' };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'good':
        return <Shield className="h-5 w-5 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Central de Segurança Avançada
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Erro de Configuração de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={refetch} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Score de Segurança */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6" />
                Central de Segurança Avançada
              </CardTitle>
              <CardDescription>
                Monitoramento e configuração de segurança em tempo real
              </CardDescription>
            </div>
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {configuration && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Score Principal */}
              <div className="lg:col-span-1">
                <div className="text-center space-y-4">
                  <div className="relative">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {configuration.security_score}
                      </span>
                    </div>
                    <div className="absolute -bottom-2 -right-2">
                      {getStatusIcon(securityStatus.status)}
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Score de Segurança</div>
                    <Badge className={getStatusColor(securityStatus.status)}>
                      {securityStatus.status.toUpperCase()}
                    </Badge>
                  </div>
                  <Progress value={configuration.security_score} className="w-full" />
                </div>
              </div>

              {/* Métricas Principais */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Cobertura RLS</div>
                      <div className="text-lg font-semibold">
                        {configuration.rls_coverage.coverage_percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {configuration.rls_coverage.enabled_tables}/{configuration.rls_coverage.total_tables} tabelas
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <Lock className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Funções Seguras</div>
                      <div className="text-lg font-semibold">
                        {configuration.security_functions.critical_functions_available}/
                        {configuration.security_functions.expected_functions}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {configuration.security_functions.all_present ? 'Completo' : 'Incompleto'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Eye className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Logs Auditoria</div>
                      <div className="text-lg font-semibold">
                        {configuration.audit_logging.recent_entries}
                      </div>
                      <div className="text-xs text-muted-foreground">Últimas 24h</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recomendações */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recomendações de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Settings className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabelas Desprotegidas */}
      {configuration && configuration.rls_coverage.unprotected_tables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Tabelas Sem Proteção RLS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                As seguintes tabelas não têm Row Level Security ativado:
              </AlertDescription>
            </Alert>
            <div className="flex flex-wrap gap-2 mt-4">
              {configuration.rls_coverage.unprotected_tables.map((table) => (
                <Badge key={table} variant="destructive">
                  {table}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs para diferentes seções */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monitoring">Monitor de Alertas</TabsTrigger>
          <TabsTrigger value="alerts">Central de Alertas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="monitoring">
          <SecurityDashboard />
        </TabsContent>
        
        <TabsContent value="alerts">
          <SecurityAlertsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}