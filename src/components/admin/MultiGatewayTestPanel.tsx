import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useMultiGatewayService } from '@/hooks/useMultiGatewayService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, TestTube, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

export const MultiGatewayTestPanel = () => {
  const { user } = useAuth();
  const { gateways, metrics, loading, sendSMS, testGateway, refreshStatuses } = useMultiGatewayService();
  const { toast } = useToast();

  const [testMessage, setTestMessage] = useState({
    to: '+244923456789',
    from: 'SMSAO',
    text: 'Teste de multi-gateway SMS. Mensagem enviada via sistema inteligente de roteamento.'
  });
  const [sending, setSending] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  const handleSendTest = async () => {
    if (!user) return;

    setSending(true);
    try {
      const result = await sendSMS(testMessage, user.id);
      
      setTestResults(prev => [
        {
          ...result,
          timestamp: new Date().toISOString(),
          phoneNumber: testMessage.to
        },
        ...prev.slice(0, 9) // Keep last 10 results
      ]);

      toast({
        title: result.success ? "SMS Enviado!" : "Falha no Envio",
        description: result.success 
          ? `Via ${result.gateway}${result.fallbackUsed ? ' (fallback)' : ''}`
          : result.error,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar SMS via multi-gateway",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleTestGateway = async (gatewayName: string) => {
    await testGateway(gatewayName);
  };

  const getStatusIcon = (available: boolean, configured: boolean) => {
    if (!configured) return <XCircle className="w-4 h-4 text-destructive" />;
    if (available) return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusBadge = (available: boolean, configured: boolean) => {
    if (!configured) return <Badge variant="destructive">Não Configurado</Badge>;
    if (available) return <Badge variant="default" className="bg-green-500">Online</Badge>;
    return <Badge variant="secondary">Offline</Badge>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gateway Status Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Status dos Gateways</CardTitle>
              <CardDescription>Monitoramento em tempo real dos gateways SMS</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStatuses}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {gateways.map((gateway) => (
            <div key={gateway.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(gateway.available, gateway.configured)}
                <div>
                  <h3 className="font-medium">{gateway.displayName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {gateway.balance !== undefined ? `Saldo: ${gateway.balance}` : 'Saldo indisponível'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(gateway.available, gateway.configured)}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestGateway(gateway.name)}
                >
                  <TestTube className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Test Message Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Teste de Envio Multi-Gateway</CardTitle>
          <CardDescription>Teste o sistema de roteamento inteligente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-phone">Número de Destino</Label>
            <Input
              id="test-phone"
              value={testMessage.to}
              onChange={(e) => setTestMessage(prev => ({ ...prev, to: e.target.value }))}
              placeholder="+244923456789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-sender">Sender ID</Label>
            <Input
              id="test-sender"
              value={testMessage.from}
              onChange={(e) => setTestMessage(prev => ({ ...prev, from: e.target.value }))}
              placeholder="SMSAO"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-message">Mensagem</Label>
            <Textarea
              id="test-message"
              value={testMessage.text}
              onChange={(e) => setTestMessage(prev => ({ ...prev, text: e.target.value }))}
              rows={3}
            />
          </div>

          <Button
            onClick={handleSendTest}
            disabled={sending || !testMessage.to || !testMessage.text}
            className="w-full"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Enviar Teste
          </Button>
        </CardContent>
      </Card>

      {/* Metrics Panel */}
      {metrics && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Métricas de Roteamento (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{metrics.totalSent}</div>
                <div className="text-sm text-muted-foreground">Total Enviado</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{metrics.successRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">{metrics.fallbackRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Taxa de Fallback</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">
                  {Object.keys(metrics.gatewayDistribution).length}
                </div>
                <div className="text-sm text-muted-foreground">Gateways Ativos</div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <h4 className="font-medium">Distribuição por Gateway</h4>
              {Object.entries(metrics.gatewayDistribution).map(([gateway, count]) => (
                <div key={gateway} className="flex justify-between">
                  <span className="capitalize">{gateway}</span>
                  <Badge variant="outline">{count} SMS</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Resultados dos Testes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                    <div>
                      <div className="font-medium">
                        {result.phoneNumber} → {result.gateway}
                        {result.fallbackUsed && <Badge variant="secondary" className="ml-2">Fallback</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(result.timestamp).toLocaleTimeString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {result.success ? (
                      <Badge variant="default">Sucesso</Badge>
                    ) : (
                      <Badge variant="destructive">Falha</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};