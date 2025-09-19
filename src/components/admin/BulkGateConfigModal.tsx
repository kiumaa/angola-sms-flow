import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, X, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BulkGateConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigSaved: () => void;
}

interface TestResult {
  success: boolean;
  balance?: number;
  currency?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  api_version?: string;
  error?: string;
}

export function BulkGateConfigModal({ open, onOpenChange, onConfigSaved }: BulkGateConfigModalProps) {
  const [applicationId, setApplicationId] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [v2ApiKey, setV2ApiKey] = useState('');
  const [useV2Api, setUseV2Api] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const { toast } = useToast();

  const resetForm = () => {
    setApplicationId('');
    setApiToken('');
    setV2ApiKey('');
    setUseV2Api(false);
    setTestResult(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const testConnection = async () => {
    if ((!applicationId || !apiToken) && !v2ApiKey) {
      toast({
        title: "Erro",
        description: "Preencha as credenciais antes de testar",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const credentials = useV2Api ? {
        apiKey: v2ApiKey
      } : {
        applicationId,
        apiToken
      };

      const { data, error } = await supabase.functions.invoke('bulkgate-balance', {
        body: credentials
      });

      if (error) {
        setTestResult({
          success: false,
          error: error.message || 'Erro ao testar conexão'
        });
      } else {
        setTestResult(data);
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveConfiguration = async () => {
    if (!testResult?.success) {
      toast({
        title: "Erro",
        description: "Teste a conexão primeiro",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const credentials = useV2Api ? {
        apiKey: v2ApiKey
      } : {
        applicationId,
        apiToken
      };

      const { error } = await supabase.functions.invoke('save-bulkgate-credentials', {
        body: credentials
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Configuração BulkGate salva com sucesso",
      });

      onConfigSaved();
      handleClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao salvar configuração',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar BulkGate</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Configure suas credenciais BulkGate para envio de SMS para Angola e outros países PALOP.
              <br />
              <strong>Formatos suportados:</strong>
              <br />
              • Application ID + Token (formato: applicationId:applicationToken)
              <br />
              • Bearer Token único (para API v2)
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useV2Api"
                checked={useV2Api}
                onChange={(e) => setUseV2Api(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="useV2Api">Usar Bearer Token único (experimental)</Label>
            </div>

            {useV2Api ? (
              <div className="space-y-2">
                <Label htmlFor="v2ApiKey">Bearer Token</Label>
                <Input
                  id="v2ApiKey"
                  type="password"
                  value={v2ApiKey}
                  onChange={(e) => setV2ApiKey(e.target.value)}
                  placeholder="Bearer token único (sem dois pontos)"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="applicationId">Application ID</Label>
                  <Input
                    id="applicationId"
                    value={applicationId}
                    onChange={(e) => setApplicationId(e.target.value)}
                    placeholder="Seu Application ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiToken">API Token</Label>
                  <Input
                    id="apiToken"
                    type="password"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Seu API Token"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={testConnection}
              disabled={isTesting || ((!applicationId || !apiToken) && !v2ApiKey)}
              variant="outline"
              className="flex-1"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                'Testar Conexão'
              )}
            </Button>
          </div>

          {testResult && (
            <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {testResult.success ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>
                {testResult.success ? (
                  <div className="space-y-1">
                    <p className="font-medium text-green-800">Conexão bem-sucedida!</p>
                    <p className="text-sm text-green-700">
                      Balance: {testResult.balance} {testResult.currency}
                    </p>
                    <p className="text-sm text-green-700">
                      API: {testResult.api_version}
                    </p>
                    {testResult.user && (
                      <p className="text-sm text-green-700">
                        Conta: {testResult.user.name} ({testResult.user.email})
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-red-800">{testResult.error}</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={saveConfiguration}
              disabled={isLoading || !testResult?.success}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}