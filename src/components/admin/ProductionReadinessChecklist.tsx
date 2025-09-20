import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock,
  Shield,
  Database,
  Zap,
  Globe,
  Users,
  FileText,
  Settings,
  RefreshCw
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'failed' | 'warning';
  priority: 'high' | 'medium' | 'low';
  automated: boolean;
  lastChecked?: Date;
  details?: string;
}

interface CategoryProgress {
  total: number;
  completed: number;
  failed: number;
  pending: number;
}

export function ProductionReadinessChecklist() {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    // Segurança
    {
      id: 'security-ssl',
      category: 'Segurança',
      title: 'Certificado SSL configurado',
      description: 'HTTPS habilitado em todos os domínios',
      status: 'completed',
      priority: 'high',
      automated: true,
      lastChecked: new Date()
    },
    {
      id: 'security-rls',
      category: 'Segurança',
      title: 'RLS policies configuradas',
      description: 'Todas as tabelas têm políticas de segurança',
      status: 'completed',
      priority: 'high',
      automated: true,
      lastChecked: new Date()
    },
    {
      id: 'security-secrets',
      category: 'Segurança',
      title: 'Secrets e credenciais seguras',
      description: 'Todas as credenciais estão em secrets criptografados',
      status: 'warning',
      priority: 'high',
      automated: true,
      lastChecked: new Date(),
      details: 'Algumas credenciais ainda em texto plano'
    },
    
    // Performance
    {
      id: 'perf-caching',
      category: 'Performance',
      title: 'Sistema de cache implementado',
      description: 'Cache configurado para queries frequentes',
      status: 'completed',
      priority: 'medium',
      automated: false
    },
    {
      id: 'perf-cdn',
      category: 'Performance',
      title: 'CDN configurado',
      description: 'Assets estáticos servidos via CDN',
      status: 'pending',
      priority: 'medium',
      automated: false
    },
    {
      id: 'perf-compression',
      category: 'Performance',
      title: 'Compressão habilitada',
      description: 'Gzip/Brotli configurado para assets',
      status: 'completed',
      priority: 'low',
      automated: true,
      lastChecked: new Date()
    },
    
    // Monitoramento
    {
      id: 'monitor-logging',
      category: 'Monitoramento',
      title: 'Sistema de logs implementado',
      description: 'Logs estruturados e centralizados',
      status: 'completed',
      priority: 'high',
      automated: true,
      lastChecked: new Date()
    },
    {
      id: 'monitor-alerts',
      category: 'Monitoramento',
      title: 'Alertas configurados',
      description: 'Alertas para métricas críticas',
      status: 'completed',
      priority: 'high',
      automated: false
    },
    {
      id: 'monitor-uptime',
      category: 'Monitoramento',
      title: 'Monitoramento de uptime',
      description: 'Verificação contínua de disponibilidade',
      status: 'pending',
      priority: 'medium',
      automated: false
    },
    
    // Backup e Recuperação
    {
      id: 'backup-automatic',
      category: 'Backup',
      title: 'Backups automáticos',
      description: 'Backup diário do banco de dados',
      status: 'completed',
      priority: 'high',
      automated: true,
      lastChecked: new Date()
    },
    {
      id: 'backup-retention',
      category: 'Backup',
      title: 'Política de retenção',
      description: 'Backups mantidos por 30 dias',
      status: 'completed',
      priority: 'medium',
      automated: true,
      lastChecked: new Date()
    },
    {
      id: 'backup-recovery',
      category: 'Backup',
      title: 'Teste de recuperação',
      description: 'Procedimento de restore testado',
      status: 'warning',
      priority: 'high',
      automated: false,
      details: 'Último teste há 2 meses'
    },
    
    // Compliance
    {
      id: 'compliance-lgpd',
      category: 'Compliance',
      title: 'Conformidade LGPD',
      description: 'Políticas de privacidade implementadas',
      status: 'completed',
      priority: 'high',
      automated: false
    },
    {
      id: 'compliance-terms',
      category: 'Compliance',
      title: 'Termos de uso atualizados',
      description: 'Documentos legais revisados',
      status: 'completed',
      priority: 'medium',
      automated: false
    },
    {
      id: 'compliance-audit',
      category: 'Compliance',
      title: 'Log de auditoria',
      description: 'Trilha de auditoria para ações críticas',
      status: 'completed',
      priority: 'high',
      automated: true,
      lastChecked: new Date()
    }
  ]);

  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [lastFullCheck, setLastFullCheck] = useState(new Date());

  const getCategoryProgress = (category: string): CategoryProgress => {
    const items = checklistItems.filter(item => item.category === category);
    return {
      total: items.length,
      completed: items.filter(item => item.status === 'completed').length,
      failed: items.filter(item => item.status === 'failed').length,
      pending: items.filter(item => item.status === 'pending').length
    };
  };

  const getOverallProgress = () => {
    const total = checklistItems.length;
    const completed = checklistItems.filter(item => item.status === 'completed').length;
    return Math.round((completed / total) * 100);
  };

  const getStatusIcon = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completo</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Segurança':
        return <Shield className="h-5 w-5" />;
      case 'Performance':
        return <Zap className="h-5 w-5" />;
      case 'Monitoramento':
        return <Globe className="h-5 w-5" />;
      case 'Backup':
        return <Database className="h-5 w-5" />;
      case 'Compliance':
        return <FileText className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const runAutomatedChecks = async () => {
    setIsRunningCheck(true);
    try {
      // Simular verificações automáticas
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setChecklistItems(prev => prev.map(item => {
        if (item.automated) {
          // Simular resultados aleatórios para demonstração
          const rand = Math.random();
          const newStatus = rand > 0.8 ? 'warning' : 'completed';
          
          return {
            ...item,
            status: newStatus,
            lastChecked: new Date()
          };
        }
        return item;
      }));
      
      setLastFullCheck(new Date());
      toast.success("Verificação automática concluída");
    } catch (error) {
      toast.error("Erro ao executar verificações");
    } finally {
      setIsRunningCheck(false);
    }
  };

  const categories = Array.from(new Set(checklistItems.map(item => item.category)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Checklist de Produção</h2>
          <p className="text-muted-foreground">
            Última verificação: {lastFullCheck.toLocaleString()}
          </p>
        </div>
        <Button 
          onClick={runAutomatedChecks} 
          disabled={isRunningCheck}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRunningCheck ? 'animate-spin' : ''}`} />
          Executar Verificações
        </Button>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Progresso Geral</CardTitle>
              <CardDescription>
                Status da preparação para produção
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{getOverallProgress()}%</div>
              <div className="text-sm text-muted-foreground">Completo</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={getOverallProgress()} className="h-3" />
          <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
            <span>{checklistItems.filter(i => i.status === 'completed').length} de {checklistItems.length} itens completos</span>
            <span>{checklistItems.filter(i => i.status === 'failed' || i.status === 'warning').length} requerem atenção</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Category Summary */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const progress = getCategoryProgress(category);
              const percentage = Math.round((progress.completed / progress.total) * 100);
              
              return (
                <Card key={category}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {getCategoryIcon(category)}
                      {category}
                    </CardTitle>
                    <Badge variant={percentage === 100 ? "default" : percentage > 50 ? "secondary" : "destructive"}>
                      {percentage}%
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <Progress value={percentage} className="h-2" />
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>{progress.completed}/{progress.total} completos</span>
                      {progress.failed > 0 && (
                        <span className="text-red-600">{progress.failed} falharam</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* High Priority Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Itens de Alta Prioridade
              </CardTitle>
              <CardDescription>
                Itens críticos que requerem atenção imediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {checklistItems
                  .filter(item => item.priority === 'high' && item.status !== 'completed')
                  .map((item) => (
                    <Alert key={item.id} className={`${
                      item.status === 'failed' ? 'border-red-200 bg-red-50' :
                      item.status === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                      'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-start gap-3">
                        {getStatusIcon(item.status)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{item.title}</h4>
                            {getStatusBadge(item.status)}
                          </div>
                          <AlertDescription className="mt-1">
                            {item.description}
                            {item.details && (
                              <div className="mt-1 text-sm text-muted-foreground">
                                {item.details}
                              </div>
                            )}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                
                {checklistItems.filter(item => item.priority === 'high' && item.status !== 'completed').length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                    <p>Todos os itens de alta prioridade estão completos!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {categories.map(category => (
          <TabsContent key={category.toLowerCase()} value={category.toLowerCase().replace('ç', 'c').replace('ã', 'a')} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon(category)}
                  {category}
                </CardTitle>
                <CardDescription>
                  Itens de verificação para {category.toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {checklistItems
                    .filter(item => item.category === category)
                    .map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        {getStatusIcon(item.status)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{item.title}</h4>
                            <div className="flex items-center gap-2">
                              {item.automated && (
                                <Badge variant="outline" className="text-xs">Auto</Badge>
                              )}
                              {getStatusBadge(item.status)}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                          {item.details && (
                            <p className="text-sm text-yellow-600 mt-1">
                              {item.details}
                            </p>
                          )}
                          {item.lastChecked && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Última verificação: {item.lastChecked.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}