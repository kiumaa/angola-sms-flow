import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, TestTube, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface TestResult {
  success: boolean;
  api_version?: string;
  status?: number;
  data?: any;
  error?: string;
  test_type?: string;
}

export const BulkGateTestPanel = () => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const runBulkGateTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('bulkgate-test');
      
      if (error) {
        console.error('Test function error:', error);
        setTestResult({ 
          success: false, 
          error: error.message || 'Function execution failed' 
        });
        toast.error('Erro ao executar teste');
        return;
      }
      
      setTestResult(data);
      
      if (data.success) {
        toast.success(`Teste bem-sucedido com ${data.api_version}!`);
      } else {
        toast.error('Teste falhou - verifique as credenciais');
      }
      
    } catch (error) {
      console.error('Test error:', error);
      setTestResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
      toast.error('Erro ao executar teste');
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = () => {
    if (!testResult) return <TestTube className="h-4 w-4" />;
    if (testResult.success) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = () => {
    if (!testResult) return null;
    
    if (testResult.success) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Sucesso</Badge>;
    }
    
    return <Badge variant="destructive">Falha</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Teste Detalhado BulkGate
        </CardTitle>
        <CardDescription>
          Execute um teste diagnóstico completo das credenciais e APIs do BulkGate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            onClick={runBulkGateTest}
            disabled={testing}
            variant="outline"
            className="flex items-center gap-2"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            {testing ? 'Testando...' : 'Executar Teste'}
          </Button>
          {getStatusBadge()}
        </div>

        {testResult && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Resultados do Teste
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span>
                  <span className={`ml-2 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.success ? 'Sucesso' : 'Falha'}
                  </span>
                </div>
                
                {testResult.api_version && (
                  <div>
                    <span className="font-medium">Versão API:</span>
                    <span className="ml-2">{testResult.api_version}</span>
                  </div>
                )}
                
                {testResult.status && (
                  <div>
                    <span className="font-medium">Código HTTP:</span>
                    <span className="ml-2">{testResult.status}</span>
                  </div>
                )}
                
                {testResult.test_type && (
                  <div>
                    <span className="font-medium">Tipo de Teste:</span>
                    <span className="ml-2">{testResult.test_type}</span>
                  </div>
                )}
              </div>

              {testResult.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">
                    <span className="font-medium">Erro:</span> {testResult.error}
                  </p>
                </div>
              )}

              {testResult.data && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-gray-800 text-sm mb-2 font-medium">Dados da Resposta:</p>
                  <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};