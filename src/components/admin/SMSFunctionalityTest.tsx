import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Shield, 
  Database, 
  Send, 
  RefreshCw,
  AlertTriangle,
  Settings
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface TestResult {
  id: string;
  test_name: string;
  status: 'success' | 'failed' | 'warning' | 'pending';
  details: string;
  timestamp: string;
  duration_ms?: number;
}

const SMSFunctionalityTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        
        setIsAdmin(!!roles);
      }
    };
    checkUserRole();
  }, []);

  const addResult = (test_name: string, status: TestResult['status'], details: string, duration_ms?: number) => {
    const result: TestResult = {
      id: Date.now().toString() + Math.random(),
      test_name,
      status,
      details,
      timestamp: new Date().toISOString(),
      duration_ms
    };
    setResults(prev => [result, ...prev]);
    return result;
  };

  const runComprehensiveTest = async () => {
    setIsLoading(true);
    setResults([]);
    
    try {
      // Test 1: Database Configuration Check
      const configStart = Date.now();
      addResult('Database Configuration Check', 'pending', 'Verificando configurações do SMS...');
      
      const { data: configs, error: configError } = await supabase
        .from('sms_configurations')
        .select('*')
        .eq('gateway_name', 'bulksms');

      if (configError) {
        addResult('Database Configuration Check', 'failed', `Erro: ${configError.message}`, Date.now() - configStart);
      } else if (configs && configs.length > 0) {
        const config = configs[0];
        const hasSecrets = config.api_token_id_secret_name && config.api_token_secret_name;
        const isEncrypted = config.credentials_encrypted;
        
        if (hasSecrets && isEncrypted) {
          addResult('Database Configuration Check', 'success', 'Configuração segura encontrada', Date.now() - configStart);
        } else if (hasSecrets && !isEncrypted) {
          addResult('Database Configuration Check', 'warning', 'Secrets configurados mas flag de encriptação=false', Date.now() - configStart);
        } else {
          addResult('Database Configuration Check', 'warning', 'Usando credenciais em texto simples', Date.now() - configStart);
        }
      } else {
        addResult('Database Configuration Check', 'failed', 'Nenhuma configuração encontrada', Date.now() - configStart);
      }

      // Test 2: Security Check - Check for encrypted secrets
      const secStart = Date.now();
      addResult('Security Check', 'pending', 'Verificando segurança...');
      
      try {
        // Check if secrets are configured properly in sms_configurations
        const { data: configs, error: configError } = await supabase
          .from('sms_configurations')
          .select('api_token_id_secret_name, api_token_secret_name, credentials_encrypted')
          .eq('gateway_name', 'bulksms');

        if (configError) {
          addResult('Security Check', 'failed', `Erro: ${configError.message}`, Date.now() - secStart);
        } else if (configs && configs.length > 0) {
          const config = configs[0];
          if (config.api_token_id_secret_name && config.api_token_secret_name) {
            addResult('Security Check', 'success', 'Secrets seguros configurados corretamente', Date.now() - secStart);
          } else {
            addResult('Security Check', 'warning', 'Usando credenciais em texto simples', Date.now() - secStart);
          }
        } else {
          addResult('Security Check', 'failed', 'Configuração não encontrada', Date.now() - secStart);
        }
      } catch (err: any) {
        addResult('Security Check', 'warning', `Erro na verificação: ${err.message}`, Date.now() - secStart);
      }

      // Test 3: Gateway Status
      const gatewayStart = Date.now();
      addResult('Gateway Status', 'pending', 'Testando conectividade com BulkSMS...');
      
      try {
        const { data: gatewayData, error: gatewayError } = await supabase.functions.invoke('gateway-status', {
          body: { gateway_name: 'bulksms' }
        });

        if (gatewayError) {
          addResult('Gateway Status', 'failed', `Erro: ${gatewayError.message}`, Date.now() - gatewayStart);
        } else if (gatewayData?.status === 'online') {
          addResult('Gateway Status', 'success', `Gateway online. Saldo: ${gatewayData.balance || 'N/A'}`, Date.now() - gatewayStart);
        } else {
          addResult('Gateway Status', 'failed', `Gateway offline: ${gatewayData?.error || 'Sem resposta'}`, Date.now() - gatewayStart);
        }
      } catch (err: any) {
        addResult('Gateway Status', 'failed', `Erro de conectividade: ${err.message}`, Date.now() - gatewayStart);
      }

      // Test 4: SMS Send Test
      const smsStart = Date.now();
      addResult('SMS Send Test', 'pending', 'Enviando SMS de teste...');
      
      try {
        const { data: smsData, error: smsError } = await supabase.functions.invoke('send-quick-sms', {
          body: {
            recipients: ['+244912345678'], // Número de teste
            message: 'Teste de verificação pós-migração de segurança ✅',
            sender_id: 'SMSAO'
          }
        });

        if (smsError) {
          addResult('SMS Send Test', 'failed', `Erro: ${smsError.message}`, Date.now() - smsStart);
        } else if (smsData?.success && smsData.sent > 0) {
          addResult('SMS Send Test', 'success', `SMS enviado com sucesso! Créditos: ${smsData.credits_debited}`, Date.now() - smsStart);
        } else {
          addResult('SMS Send Test', 'failed', `Falha no envio: ${smsData?.error || 'Erro desconhecido'}`, Date.now() - smsStart);
        }
      } catch (err: any) {
        addResult('SMS Send Test', 'failed', `Erro na execução: ${err.message}`, Date.now() - smsStart);
      }

      // Test 5: Audit Log Check
      const auditStart = Date.now();
      addResult('Audit Log Check', 'pending', 'Verificando logs de auditoria...');
      
      try {
        const { data: auditData, error: auditError } = await supabase
          .from('admin_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (auditError) {
          addResult('Audit Log Check', 'failed', `Erro: ${auditError.message}`, Date.now() - auditStart);
        } else if (auditData && auditData.length > 0) {
          const recentChanges = auditData.length;
          addResult('Audit Log Check', 'success', `${recentChanges} registros de auditoria encontrados`, Date.now() - auditStart);
        } else {
          addResult('Audit Log Check', 'warning', 'Nenhum log de auditoria encontrado', Date.now() - auditStart);
        }
      } catch (err: any) {
        addResult('Audit Log Check', 'warning', `Erro: ${err.message}`, Date.now() - auditStart);
      }

      toast({
        title: "✅ Testes Concluídos",
        description: "Verificação de funcionalidade SMS finalizada",
      });

    } catch (error: any) {
      toast({
        title: "❌ Erro nos Testes",
        description: error.message || "Erro inesperado durante os testes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
      case 'pending':
        return <Badge variant="secondary">Em andamento</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  if (!isAdmin) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Acesso negado. Esta página é apenas para administradores.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Teste de Funcionalidade SMS
          </CardTitle>
          <CardDescription>
            Verificação completa do sistema após migração de segurança
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runComprehensiveTest} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Executando testes...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Executar Testes de Verificação
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados dos Testes</CardTitle>
            <CardDescription>
              Resultados detalhados da verificação de funcionalidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="glass-card p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.test_name}</span>
                      {getStatusBadge(result.status)}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {result.duration_ms && `${result.duration_ms}ms`}
                      <div className="text-xs">
                        {new Date(result.timestamp).toLocaleTimeString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.details}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SMSFunctionalityTest;