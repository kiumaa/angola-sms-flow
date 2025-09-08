import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

interface DiagnosticResult {
  check: string;
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: string;
}

interface SMSGatewayDiagnosticsProps {
  gatewayName: string;
  onClose?: () => void;
}

export default function SMSGatewayDiagnostics({ gatewayName, onClose }: SMSGatewayDiagnosticsProps) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setRunning(true);
    setResults([]);
    
    const diagnosticResults: DiagnosticResult[] = [];

    try {
      // 1. Verificar configuração no banco de dados
      try {
        const { data: gatewayConfig, error } = await supabase
          .from('sms_gateways')
          .select('*')
          .eq('name', gatewayName)
          .single();

        if (error) throw error;

        diagnosticResults.push({
          check: 'Configuração no Banco',
          status: 'success',
          message: 'Gateway encontrado no banco de dados',
          details: `Ativo: ${gatewayConfig.is_active ? 'Sim' : 'Não'}, Primário: ${gatewayConfig.is_primary ? 'Sim' : 'Não'}`
        });

        // 2. Verificar configuração de credenciais
        if (gatewayName === 'bulksms') {
          const { data: smsConfig } = await supabase
            .from('sms_configurations')
            .select('*')
            .eq('gateway_name', 'bulksms')
            .single();

          if (smsConfig && smsConfig.api_token_id_secret_name && smsConfig.api_token_secret_name) {
            diagnosticResults.push({
              check: 'Configuração de Credenciais',
              status: 'success',
              message: 'Credenciais configuradas nos secrets',
              details: `Token ID Secret: ${smsConfig.api_token_id_secret_name}, Token Secret: ${smsConfig.api_token_secret_name}`
            });
          } else {
            diagnosticResults.push({
              check: 'Configuração de Credenciais',
              status: 'error',
              message: 'Credenciais não configuradas',
              details: 'Configure os secrets BULKSMS_TOKEN_ID e BULKSMS_TOKEN_SECRET'
            });
          }
        }

      } catch (error) {
        diagnosticResults.push({
          check: 'Configuração no Banco',
          status: 'error',
          message: 'Gateway não encontrado',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }

      // 3. Testar conectividade da API
      try {
        const { data, error } = await supabase.functions.invoke('gateway-status', {
          body: { 
            gateway_name: gatewayName,
            test_mode: true 
          }
        });

        if (error) throw error;

        if (data.status === 'online') {
          diagnosticResults.push({
            check: 'Conectividade da API',
            status: 'success',
            message: 'API respondendo corretamente',
            details: `Tempo de resposta: ${data.response_time}ms${data.balance ? `, Saldo: $${data.balance}` : ''}`
          });
        } else {
          diagnosticResults.push({
            check: 'Conectividade da API',
            status: 'error',
            message: 'API não respondendo',
            details: data.error || 'Erro na comunicação com a API'
          });
        }
      } catch (error) {
        diagnosticResults.push({
          check: 'Conectividade da API',
          status: 'error',
          message: 'Falha no teste de conectividade',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }

      // 4. Verificar logs recentes
      try {
        const { data: recentLogs, error } = await supabase
          .from('sms_logs')
          .select('status, error_message, created_at')
          .eq('gateway_used', gatewayName)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        if (recentLogs && recentLogs.length > 0) {
          const successCount = recentLogs.filter(log => log.status === 'sent' || log.status === 'delivered').length;
          const successRate = (successCount / recentLogs.length) * 100;

          diagnosticResults.push({
            check: 'Logs Recentes (24h)',
            status: successRate > 80 ? 'success' : successRate > 50 ? 'warning' : 'error',
            message: `${recentLogs.length} envios encontrados`,
            details: `Taxa de sucesso: ${successRate.toFixed(1)}% (${successCount}/${recentLogs.length})`
          });
        } else {
          diagnosticResults.push({
            check: 'Logs Recentes (24h)',
            status: 'info',
            message: 'Nenhum envio nas últimas 24 horas',
            details: 'Gateway não utilizado recentemente'
          });
        }
      } catch (error) {
        diagnosticResults.push({
          check: 'Logs Recentes',
          status: 'warning',
          message: 'Erro ao verificar logs',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }

      setResults(diagnosticResults);

      // Mostrar resumo no toast
      const errorCount = diagnosticResults.filter(r => r.status === 'error').length;
      const warningCount = diagnosticResults.filter(r => r.status === 'warning').length;

      if (errorCount === 0 && warningCount === 0) {
        toast({
          title: "Diagnóstico Completo",
          description: "Todos os testes passaram com sucesso",
        });
      } else if (errorCount > 0) {
        toast({
          title: "Problemas Encontrados",
          description: `${errorCount} erro(s) e ${warningCount} aviso(s) encontrados`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Diagnóstico Completo",
          description: `${warningCount} aviso(s) encontrados`,
          variant: "default"
        });
      }

    } catch (error) {
      console.error('Diagnostic error:', error);
      toast({
        title: "Erro no Diagnóstico",
        description: "Erro ao executar diagnósticos",
        variant: "destructive"
      });
    } finally {
      setRunning(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-600">Sucesso</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-600">Aviso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'info':
        return <Badge variant="outline">Info</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Diagnóstico do Gateway: {gatewayName}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={runDiagnostics} 
              disabled={running}
              variant="default"
            >
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {running ? 'Executando...' : 'Executar Diagnóstico'}
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="outline">
                Fechar
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {results.length === 0 && !running && (
          <div className="text-center py-8 text-muted-foreground">
            Clique em "Executar Diagnóstico" para verificar o status do gateway
          </div>
        )}

        {running && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Executando diagnósticos...</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                {getStatusIcon(result.status)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{result.check}</h4>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      {result.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}