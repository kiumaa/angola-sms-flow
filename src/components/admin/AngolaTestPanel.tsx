import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Send, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface TestResult {
  success: boolean;
  gateway: string;
  messageId?: string;
  error?: string;
  senderIdUsed?: string;
  fallbackUsed: boolean;
  timestamp: string;
}

export default function AngolaTestPanel() {
  const [phoneNumber, setPhoneNumber] = useState('+244');
  const [message, setMessage] = useState('Teste de SMS para Angola via BulkGate com Sender ID SMSAO');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const { toast } = useToast();

  const validateAngolanNumber = (phone: string): boolean => {
    const normalized = phone.replace(/[\s\-\(\)]/g, '');
    return normalized.startsWith('+244') && normalized.length >= 12;
  };

  const runAngolaTest = async () => {
    if (!validateAngolanNumber(phoneNumber)) {
      toast({
        title: "Número Inválido",
        description: "Insira um número de Angola válido (+244xxxxxxxxx)",
        variant: "destructive"
      });
      return;
    }

    if (message.length < 10) {
      toast({
        title: "Mensagem Muito Curta",
        description: "Insira uma mensagem com pelo menos 10 caracteres",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🧪 Iniciando teste específico para Angola...');
      
      const { data, error } = await supabase.functions.invoke('sms-gateway-dispatcher', {
        body: {
          message: {
            to: phoneNumber,
            from: 'SMSAO', // This will be overridden by BulkGate logic
            text: message
          },
          userId: currentUser.user.id
        }
      });

      if (error) throw error;

      const result: TestResult = {
        success: data.finalResult.success,
        gateway: data.finalResult.gateway,
        messageId: data.finalResult.messageId,
        error: data.finalResult.error,
        senderIdUsed: data.finalResult.gateway === 'bulkgate' ? 'SMSAO' : 'SMS',
        fallbackUsed: data.fallbackUsed,
        timestamp: new Date().toISOString()
      };

      setTestResult(result);

      if (result.success) {
        toast({
          title: "Teste Bem-Sucedido!",
          description: `SMS enviado via ${result.gateway.toUpperCase()} com Sender ID: ${result.senderIdUsed}`,
        });
      } else {
        toast({
          title: "Teste Falhou",
          description: result.error || 'Erro desconhecido',
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ Erro no teste para Angola:', error);
      toast({
        title: "Erro no Teste",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Teste Específico para Angola
        </CardTitle>
        <CardDescription>
          Teste o envio para números de Angola para garantir que use BulkGate com Sender ID "SMSAO"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Configuração Angola:</strong> Números +244 devem automaticamente usar BulkGate com Sender ID "SMSAO" aprovado.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="angola-phone">Número de Angola</Label>
            <Input
              id="angola-phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+244912345678"
              className={!validateAngolanNumber(phoneNumber) && phoneNumber.length > 4 ? 'border-red-500' : ''}
            />
            {!validateAngolanNumber(phoneNumber) && phoneNumber.length > 4 && (
              <p className="text-sm text-red-600">Número de Angola inválido</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="angola-message">Mensagem de Teste</Label>
            <Input
              id="angola-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Sua mensagem de teste..."
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground">{message.length}/160 caracteres</p>
          </div>
        </div>

        <Button 
          onClick={runAngolaTest}
          disabled={testing || !validateAngolanNumber(phoneNumber) || message.length < 10}
          className="w-full"
        >
          {testing ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Testando Envio para Angola...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Testar Envio para Angola
            </>
          )}
        </Button>

        {testResult && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Resultado do Teste</h4>
                <Badge variant={testResult.success ? 'default' : 'destructive'}>
                  {testResult.success ? 'Sucesso' : 'Falha'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Gateway Usado</p>
                  <p className="font-semibold flex items-center gap-2">
                    {testResult.gateway.toUpperCase()}
                    {testResult.gateway === 'bulkgate' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sender ID</p>
                  <p className="font-semibold">{testResult.senderIdUsed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ID da Mensagem</p>
                  <p className="font-mono text-xs">{testResult.messageId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fallback Usado</p>
                  <p className="font-semibold">{testResult.fallbackUsed ? 'Sim' : 'Não'}</p>
                </div>
              </div>

              {testResult.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{testResult.error}</AlertDescription>
                </Alert>
              )}

              {testResult.gateway !== 'bulkgate' && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>ATENÇÃO:</strong> O número de Angola não foi roteado para BulkGate! 
                    Verifique a configuração de roteamento por país.
                  </AlertDescription>
                </Alert>
              )}

              {testResult.gateway === 'bulkgate' && testResult.success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Perfeito!</strong> Mensagem enviada via BulkGate com Sender ID "SMSAO" para Angola.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}