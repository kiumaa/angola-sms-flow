
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, TestTube, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';

interface TestResult {
  success: boolean;
  gateway: string;
  messageId?: string;
  error?: string;
  cost?: number;
  timestamp: string;
  fallbackUsed?: boolean;
  attempts?: Array<{
    gateway: string;
    result: {
      success: boolean;
      error?: string;
      messageId?: string;
    };
    timestamp: string;
  }>;
}

export default function SMSGatewayTester() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('Teste de conectividade do sistema SMS - ' + new Date().toLocaleString('pt-BR'));
  const [senderId, setSenderId] = useState('TEST');
  const [testMode, setTestMode] = useState<'production' | 'fallback' | 'specific'>('production');
  const [specificGateway, setSpecificGateway] = useState('bulkgate');
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const runConnectivityTest = async () => {
    setTesting(true);
    
    try {
      // Test both gateways status
      const [bulkgateStatus, bulksmsStatus] = await Promise.all([
        supabase.functions.invoke('gateway-status', { body: { gateway: 'bulkgate' } }),
        supabase.functions.invoke('gateway-status', { body: { gateway: 'bulksms' } })
      ]);

      const results = [];
      
      if (bulkgateStatus.data) {
        results.push({
          gateway: 'BulkGate',
          status: bulkgateStatus.data.status,
          balance: bulkgateStatus.data.balance,
          error: bulkgateStatus.data.error
        });
      }

      if (bulksmsStatus.data) {
        results.push({
          gateway: 'BulkSMS', 
          status: bulksmsStatus.data.status,
          balance: bulksmsStatus.data.balance,
          error: bulksmsStatus.data.error
        });
      }

      // Display results
      results.forEach(result => {
        if (result.status === 'active') {
          toast.success(`${result.gateway}: Conectado${result.balance ? ` (${result.balance.credits} ${result.balance.currency})` : ''}`);
        } else {
          toast.error(`${result.gateway}: ${result.error || 'Erro de conexão'}`);
        }
      });

    } catch (error) {
      console.error('Connectivity test error:', error);
      toast.error('Erro ao testar conectividade');
    } finally {
      setTesting(false);
    }
  };

  const sendTestSMS = async () => {
    if (!phoneNumber || !message) {
      toast.error('Preencha o número e mensagem');
      return;
    }

    // Validate phone number format
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      toast.error('Número de telefone deve ter pelo menos 9 dígitos');
      return;
    }

    setTesting(true);

    try {
      // Create a test campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('sms_campaigns')
        .insert({
          name: `Teste Gateway - ${new Date().toLocaleString('pt-BR')}`,
          message: message,
          status: 'sending'
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      let testPhoneNumber = cleanPhone;
      if (!testPhoneNumber.startsWith('+')) {
        testPhoneNumber = testPhoneNumber.startsWith('244') ? `+${testPhoneNumber}` : `+244${testPhoneNumber}`;
      }

      // Send the SMS
      const { data: result, error } = await supabase.functions.invoke('send-sms', {
        body: {
          campaignId: campaign.id,
          recipients: [testPhoneNumber],
          message: message,
          senderId: senderId || 'TEST'
        }
      });

      if (error) throw error;

      const testResult: TestResult = {
        success: result.totalSent > 0,
        gateway: 'Sistema',
        messageId: 'test-' + Date.now(),
        cost: result.creditsUsed,
        timestamp: new Date().toISOString(),
        fallbackUsed: false
      };

      setTestResults(prev => [testResult, ...prev]);

      if (result.totalSent > 0) {
        toast.success(`SMS enviado com sucesso! Créditos usados: ${result.creditsUsed}`);
      } else {
        toast.error(`Falha no envio: ${result.totalFailed} mensagens falharam`);
      }

    } catch (error) {
      console.error('Test SMS error:', error);
      
      const testResult: TestResult = {
        success: false,
        gateway: 'Sistema',
        error: error.message,
        timestamp: new Date().toISOString()
      };

      setTestResults(prev => [testResult, ...prev]);
      toast.error(`Erro no teste: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const simulateFallbackTest = async () => {
    setTesting(true);
    
    try {
      // First disable primary gateway temporarily by testing with invalid credentials
      toast.info('Simulando falha do gateway primário...');
      
      // This would typically involve temporarily changing gateway configuration
      // For now, we'll simulate by showing what would happen
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const testResult: TestResult = {
        success: true,
        gateway: 'BulkSMS (Fallback)',
        messageId: 'fallback-test-' + Date.now(),
        cost: 1,
        timestamp: new Date().toISOString(),
        fallbackUsed: true,
        attempts: [
          {
            gateway: 'BulkGate',
            result: { success: false, error: 'Simulated failure' },
            timestamp: new Date().toISOString()
          },
          {
            gateway: 'BulkSMS',
            result: { success: true, messageId: 'fallback-success' },
            timestamp: new Date().toISOString()
          }
        ]
      };

      setTestResults(prev => [testResult, ...prev]);
      toast.success('Teste de fallback concluído com sucesso!');
      
    } catch (error) {
      console.error('Fallback test error:', error);
      toast.error('Erro no teste de fallback');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connectivity Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Teste de Conectividade
          </CardTitle>
          <CardDescription>
            Verifica a conectividade e saldo de todos os gateways configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runConnectivityTest} 
            disabled={testing}
            className="w-full"
          >
            {testing ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Testando Conectividade...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Testar Conectividade
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* SMS Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Teste de Envio de SMS
          </CardTitle>
          <CardDescription>
            Envie um SMS de teste para verificar o funcionamento completo do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Número de Telefone</Label>
              <Input
                id="phone"
                placeholder="+244 900 000 000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sender">Sender ID</Label>
              <Input
                id="sender"
                placeholder="TEST"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              placeholder="Mensagem de teste..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Caracteres: {message.length}/160
            </p>
          </div>

          <div>
            <Label className="text-base font-medium">Modo de Teste</Label>
            <RadioGroup
              value={testMode}
              onValueChange={(value) => setTestMode(value as typeof testMode)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="production" id="production" />
                <Label htmlFor="production">Produção (Gateway Primário + Fallback)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fallback" id="fallback" />
                <Label htmlFor="fallback">Simular Fallback</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={sendTestSMS} 
              disabled={testing}
              className="flex-1"
            >
              {testing ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar SMS Teste
                </>
              )}
            </Button>

            {testMode === 'fallback' && (
              <Button 
                onClick={simulateFallbackTest} 
                disabled={testing}
                variant="outline"
              >
                Simular Fallback
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados dos Testes</CardTitle>
            <CardDescription>Histórico dos últimos testes realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{result.gateway}</span>
                      {result.fallbackUsed && (
                        <Badge variant="secondary">Fallback Usado</Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(result.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {result.success ? (
                    <div className="text-sm text-green-600">
                      Sucesso{result.messageId && ` - ID: ${result.messageId}`}
                      {result.cost && ` - Custo: ${result.cost} créditos`}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      Erro: {result.error}
                    </div>
                  )}

                  {result.attempts && result.attempts.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Tentativas:</p>
                      {result.attempts.map((attempt, attemptIndex) => (
                        <div key={attemptIndex} className="text-xs flex justify-between">
                          <span>{attempt.gateway}: {attempt.result.success ? 'Sucesso' : attempt.result.error}</span>
                          <span>{new Date(attempt.timestamp).toLocaleTimeString('pt-BR')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Guidelines */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Os testes de SMS consomem créditos reais quando enviados. 
          Use números de teste válidos e monitore o consumo de créditos. 
          O teste de fallback é simulado e não consome créditos.
        </AlertDescription>
      </Alert>
    </div>
  );
}
