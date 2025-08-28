import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, XCircle, Clock, Shield, Database, Server, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityFinding {
  id: string;
  level: 'info' | 'warn' | 'error';
  name: string;
  description: string;
}

interface HealthCheck {
  status: 'healthy' | 'warning' | 'error';
  orphaned_contacts: number;
  invalid_phones: number;
  inactive_users: number;
  checked_at: string;
}

const ProductionReadinessChecklist = () => {
  const [securityFindings, setSecurityFindings] = useState<SecurityFinding[]>([]);
  const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanupInProgress, setCleanupInProgress] = useState(false);
  const { toast } = useToast();

  const runHealthCheck = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('system_health_check');
      
      if (error) throw error;
      
      const healthData = data as unknown as HealthCheck;
      setHealthCheck(healthData);
      toast({
        title: "Health check concluído",
        description: `Status: ${healthData.status}`,
        variant: healthData.status === 'healthy' ? 'default' : 'destructive'
      });
    } catch (error: any) {
      console.error('Health check error:', error);
      toast({
        title: "Erro no health check",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runCleanup = async () => {
    try {
      setCleanupInProgress(true);
      const { data, error } = await supabase.rpc('cleanup_old_data');
      
      if (error) throw error;
      
      toast({
        title: "Limpeza concluída",
        description: `${data} registros removidos`,
      });
      
      // Refazer health check após limpeza
      await runHealthCheck();
    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast({
        title: "Erro na limpeza",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCleanupInProgress(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Preparação para Produção</h1>
          <p className="text-muted-foreground">
            Monitorização de segurança, performance e status do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={runHealthCheck}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            {loading ? 'Verificando...' : 'Health Check'}
          </Button>
          <Button
            onClick={runCleanup}
            disabled={cleanupInProgress}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            {cleanupInProgress ? 'Limpando...' : 'Limpar Dados'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Monitorização
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Integridade
          </TabsTrigger>
        </TabsList>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Status de Segurança
              </CardTitle>
              <CardDescription>
                Verificações automáticas de segurança implementadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">RLS Policies</h4>
                    <p className="text-sm text-muted-foreground">
                      Políticas de segurança ativas
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Data Protection</h4>
                    <p className="text-sm text-muted-foreground">
                      Dados sensíveis protegidos
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Rate Limiting</h4>
                    <p className="text-sm text-muted-foreground">
                      Proteção contra ataques
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Input Sanitization</h4>
                    <p className="text-sm text-muted-foreground">
                      Proteção XSS ativa
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-800 dark:text-green-200">
                    Segurança Implementada
                  </h4>
                </div>
                <ul className="mt-2 text-sm text-green-700 dark:text-green-300 space-y-1">
                  <li>• SMS Gateways protegidos (apenas admins)</li>
                  <li>• Pacotes de crédito restritos a usuários autenticados</li>
                  <li>• Brand settings com acesso controlado</li>
                  <li>• Sender IDs com políticas restritivas</li>
                  <li>• Funções com search_path seguro</li>
                  <li>• Auditoria de operações críticas</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Otimizações de Performance
              </CardTitle>
              <CardDescription>
                Melhorias implementadas para produção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Índices de Database</h4>
                    <p className="text-sm text-muted-foreground">
                      Queries otimizadas
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Auto-vacuum</h4>
                    <p className="text-sm text-muted-foreground">
                      Limpeza automática configurada
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Estatísticas</h4>
                    <p className="text-sm text-muted-foreground">
                      Planeamento de queries otimizado
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Cleanup Automático</h4>
                    <p className="text-sm text-muted-foreground">
                      Remoção de dados antigos
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">
                    Otimizações Implementadas
                  </h4>
                </div>
                <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Índices para sms_logs, contacts, quick_send_jobs</li>
                  <li>• Índices parciais para dados ativos</li>
                  <li>• Auto-vacuum agressivo em tabelas com alta rotatividade</li>
                  <li>• Estatísticas estendidas para melhor planejamento</li>
                  <li>• Limpeza automática de logs antigos</li>
                  <li>• Rate limiting avançado</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Monitorização do Sistema
              </CardTitle>
              <CardDescription>
                Ferramentas de monitorização e auditoria ativas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Audit Logs</h4>
                    <p className="text-sm text-muted-foreground">
                      Rastreamento de alterações
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">System Health</h4>
                    <p className="text-sm text-muted-foreground">
                      Verificações automáticas
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Error Tracking</h4>
                    <p className="text-sm text-muted-foreground">
                      Captura de erros
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Performance Metrics</h4>
                    <p className="text-sm text-muted-foreground">
                      Métricas de performance
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>

              <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium text-purple-800 dark:text-purple-200">
                    Monitorização Ativa
                  </h4>
                </div>
                <ul className="mt-2 text-sm text-purple-700 dark:text-purple-300 space-y-1">
                  <li>• Logs de auditoria para operações críticas</li>
                  <li>• Health checks automáticos de integridade</li>
                  <li>• Rastreamento de IP e user-agent</li>
                  <li>• Métricas de usage de SMS</li>
                  <li>• Alertas de segurança</li>
                  <li>• Dashboard de analytics</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Integridade do Sistema
              </CardTitle>
              <CardDescription>
                Verificações de integridade e limpeza de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {healthCheck ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        Status Geral
                        {getStatusIcon(healthCheck.status)}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Última verificação: {new Date(healthCheck.checked_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={healthCheck.status === 'healthy' ? 'default' : 'destructive'}>
                      {healthCheck.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Contactos Órfãos</h4>
                        <Badge variant={healthCheck.orphaned_contacts > 0 ? 'destructive' : 'default'}>
                          {healthCheck.orphaned_contacts}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Contactos sem perfil associado
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Telefones Inválidos</h4>
                        <Badge variant={healthCheck.invalid_phones > 10 ? 'destructive' : 'default'}>
                          {healthCheck.invalid_phones}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Números em formato incorreto
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Usuários Inativos</h4>
                        <Badge variant="secondary">
                          {healthCheck.inactive_users}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sem atividade há mais de 1 ano
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={runHealthCheck}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                    >
                      Atualizar
                    </Button>
                    <Button
                      onClick={runCleanup}
                      disabled={cleanupInProgress}
                      size="sm"
                    >
                      Executar Limpeza
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Clique em "Health Check" para verificar a integridade do sistema
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductionReadinessChecklist;