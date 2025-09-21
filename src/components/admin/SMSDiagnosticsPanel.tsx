import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
  duration?: number;
}

interface DiagnosticResponse {
  overall_status: string;
  total_tests: number;
  results: DiagnosticResult[];
  timestamp: string;
  recommendations: string[];
}

export const SMSDiagnosticsPanel = () => {
  const [testPhone, setTestPhone] = useState('+244900000000');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResponse | null>(null);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    if (!testPhone.match(/^\+244[9][0-9]{8}$/)) {
      toast({
        variant: "destructive",
        title: "Número inválido",
        description: "Use o formato +244XXXXXXXXX para números de Angola"
      });
      return;
    }

    setIsRunning(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('sms-diagnostic-test', {
        body: {
          test_phone: testPhone,
          gateway: 'bulksms'
        }
      });

      if (error) {
        console.error('Diagnostic error:', error);
        toast({
          variant: "destructive",
          title: "Erro no diagnóstico",
          description: error.message
        });
        return;
      }

      setResults(data);
      
      if (data.overall_status === 'success') {
        toast({
          title: "Diagnóstico completo",
          description: "Todos os testes passaram com sucesso"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Problemas encontrados",
          description: `${data.results.filter(r => r.status === 'error').length} erro(s) detectado(s)`
        });
      }
    } catch (err) {
      console.error('Error running diagnostics:', err);
      toast({
        variant: "destructive",
        title: "Erro interno",
        description: "Falha ao executar diagnósticos"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnóstico SMS</CardTitle>
        <CardDescription>
          Execute diagnósticos completos do sistema SMS para identificar problemas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-phone">Número de teste (Angola)</Label>
          <Input
            id="test-phone"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="+244900000000"
            disabled={isRunning}
          />
        </div>

        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isRunning ? 'Executando diagnósticos...' : 'Executar Diagnósticos'}
        </Button>

        {results && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Resultados</h3>
              <Badge variant={getStatusVariant(results.overall_status)}>
                {results.overall_status === 'success' ? 'Tudo OK' : 
                 results.overall_status === 'warning' ? 'Avisos' : 'Problemas'}
              </Badge>
            </div>

            <div className="space-y-2">
              {results.results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium">{result.test}</p>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                    </div>
                  </div>
                  {result.duration && (
                    <span className="text-xs text-muted-foreground">
                      {result.duration}ms
                    </span>
                  )}
                </div>
              ))}
            </div>

            {results.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Recomendações:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {results.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Executado em: {new Date(results.timestamp).toLocaleString('pt-PT')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};