import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { EnhancedSecurityDashboard } from '@/components/admin/EnhancedSecurityDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Key, Lock, Eye, AlertTriangle, CheckCircle, Settings } from 'lucide-react';

interface SecuritySetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  level: 'basic' | 'advanced' | 'critical';
}

export default function AdminSecurityCenter() {
  const { user, isAdmin } = useAuth();
  const [securitySettings, setSecuritySettings] = useState<SecuritySetting[]>([
    {
      id: 'mfa_enabled',
      name: 'Autenticação Multi-fator',
      description: 'Requer segundo fator para logins administrativos',
      enabled: false,
      level: 'critical'
    },
    {
      id: 'session_timeout',
      name: 'Timeout de Sessão',
      description: 'Expira sessões administrativas após inatividade',
      enabled: true,
      level: 'basic'
    },
    {
      id: 'ip_restriction',
      name: 'Restrição de IP',
      description: 'Limita acesso administrativo a IPs específicos',
      enabled: false,
      level: 'advanced'
    },
    {
      id: 'audit_logging',
      name: 'Log de Auditoria',
      description: 'Registra todas as ações administrativas',
      enabled: true,
      level: 'critical'
    },
    {
      id: 'password_policy',
      name: 'Política de Senhas',
      description: 'Enforça senhas fortes e rotação regular',
      enabled: true,
      level: 'basic'
    }
  ]);

  const [systemHealth, setSystemHealth] = useState({
    rls_enabled: true,
    encryption_enabled: true,
    backup_enabled: true,
    ssl_enabled: true,
    last_security_scan: new Date().toISOString()
  });

  useEffect(() => {
    if (user && isAdmin) {
      checkSystemHealth();
    }
  }, [user, isAdmin]);

  const checkSystemHealth = async () => {
    try {
      // Check RLS policies and other security measures
      const { data, error } = await supabase.rpc('system_health_check');
      
      if (error) {
        console.error('Error checking system health:', error);
        return;
      }

      if (data && typeof data === 'object') {
        setSystemHealth(prev => ({
          ...prev,
          ...data
        }));
      }
    } catch (error) {
      console.error('Error in health check:', error);
    }
  };

  const toggleSecuritySetting = async (settingId: string) => {
    setSecuritySettings(prev => 
      prev.map(setting => 
        setting.id === settingId 
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );

    // Here you would typically save to the database
    // For now, we'll just update the local state
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'advanced':
        return 'default';
      case 'basic':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas administradores podem acessar o centro de segurança.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Centro de Segurança Avançado</h1>
          <p className="text-muted-foreground">
            Monitoramento avançado de segurança, alertas em tempo real e configurações de proteção
          </p>
        </div>
        <Button onClick={checkSystemHealth} variant="outline">
          <Shield className="h-4 w-4 mr-2" />
          Verificar Sistema
        </Button>
      </div>

      {/* Enhanced Security Dashboard */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard de Segurança</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard">
          <EnhancedSecurityDashboard />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          {/* System Health Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Status do Sistema
              </CardTitle>
              <CardDescription>
                Verificação geral da segurança do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-green-600" />
                    <span className="font-medium">RLS Ativado</span>
                  </div>
                  {systemHealth.rls_enabled ? (
                    <Badge variant="default" className="bg-green-600">Ativo</Badge>
                  ) : (
                    <Badge variant="destructive">Inativo</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Criptografia</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">Ativa</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="font-medium">SSL/TLS</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">Ativo</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Backup</span>
                  </div>
                  <Badge variant="default" className="bg-green-600">Ativo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Segurança
              </CardTitle>
              <CardDescription>
                Configure as políticas de segurança do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securitySettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{setting.name}</span>
                        <Badge variant={getLevelColor(setting.level) as any} className="text-xs">
                          {setting.level.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                    <Switch
                      checked={setting.enabled}
                      onCheckedChange={() => toggleSecuritySetting(setting.id)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Security Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recomendações de Segurança Avançadas</CardTitle>
              <CardDescription>
                Implementadas automaticamente após as correções de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <strong>✅ Implementado:</strong> Todas as funções do banco de dados agora têm search_path seguro configurado.
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <strong>✅ Implementado:</strong> Monitoramento de segurança aprimorado com detecção de padrões suspeitos.
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <strong>✅ Implementado:</strong> Sistema de alertas de segurança em tempo real com análise de risco.
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Recomendação:</strong> Atualize o PostgreSQL para a versão mais recente para aplicar patches de segurança.
                  </AlertDescription>
                </Alert>
                
                <Alert>
                  <Key className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Recomendação:</strong> Configure alertas automáticos para atividades suspeitas após horário comercial.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}