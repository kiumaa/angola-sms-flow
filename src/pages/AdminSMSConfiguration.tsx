import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Send, CheckCircle, AlertTriangle, Smartphone, DollarSign, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SenderIDsSection from "@/components/admin/sms/SenderIDsSection";
export default function AdminSMSConfiguration() {
  const {
    toast
  } = useToast();
  const [isTestingSMS, setIsTestingSMS] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // API Token Configuration  
  const [apiTokenId, setApiTokenId] = useState('');
  const [apiTokenSecret, setApiTokenSecret] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Test SMS
  const [testSMS, setTestSMS] = useState({
    phoneNumber: '+244',
    message: 'Teste de SMS via SMS.AO',
    senderId: 'SMSAO'
  });

  // Função para buscar saldo
  const fetchBalance = async () => {
    setLoadingBalance(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('bulksms-balance');
      if (error) throw error;
      if (data.success) {
        setBalance(data.balance);
        toast({
          title: "Saldo Atualizado",
          description: `Saldo atual: $${data.balance.toFixed(2)} USD`
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Erro ao buscar saldo:', error);
      toast({
        title: "Erro ao buscar saldo",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingBalance(false);
    }
  };

  // Função para testar conexão com API Token
  const testConnection = async () => {
    if (!apiTokenId.trim()) {
      toast({
        title: "API Token ID obrigatório",
        description: "Digite o API Token ID antes de testar a conexão.",
        variant: "destructive"
      });
      return;
    }
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('bulksms-balance', {
        body: {
          apiTokenId: apiTokenId.trim(),
          apiTokenSecret: apiTokenSecret.trim()
        }
      });
      if (error) throw error;
      if (data.success) {
        setConnectionStatus('success');
        setBalance(data.balance);
        toast({
          title: "Conexão bem-sucedida!",
          description: `API Token válido. Saldo: $${data.balance.toFixed(2)} USD`
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      setConnectionStatus('error');
      toast({
        title: "Erro na conexão",
        description: error.message || "Falha ao conectar com BulkSMS",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Buscar saldo ao carregar
  useEffect(() => {
    fetchBalance();
  }, []);
  const handleTestSMS = async () => {
    if (!testSMS.phoneNumber || !testSMS.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o número e a mensagem antes de enviar.",
        variant: "destructive"
      });
      return;
    }
    setIsTestingSMS(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('send-sms-bulksms', {
        body: {
          contacts: [testSMS.phoneNumber],
          message: testSMS.message,
          senderId: testSMS.senderId,
          isTest: true
        }
      });
      if (error) throw error;
      toast({
        title: "SMS de teste enviado",
        description: data.success ? `SMS enviado com sucesso! Enviados: ${data.totalSent}, Falharam: ${data.totalFailed}` : "Falha no envio do SMS",
        variant: data.success && data.totalSent > 0 ? "default" : "destructive"
      });

      // Atualizar saldo após envio
      if (data.success && data.totalSent > 0) {
        setTimeout(() => fetchBalance(), 1000);
      }
    } catch (error) {
      console.error('Erro no envio:', error);
      toast({
        title: "Erro no envio",
        description: "Falha ao enviar SMS de teste",
        variant: "destructive"
      });
    } finally {
      setIsTestingSMS(false);
    }
  };
  return <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h1 className="text-2xl font-semibold">Configuração SMS - BulkSMS</h1>
      </div>

      {/* BulkSMS Gateway Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                BulkSMS API v1
              </CardTitle>
              <CardDescription>
                Gateway SMS moderno com autenticação por API Token
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                API v1 Ativo
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-800">
                <strong>Status:</strong> Sistema configurado e pronto para usar
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>API v1:</strong> https://api.bulksms.com/v1/messages (Produção)
            </p>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                <strong>Webhook:</strong> Configurado para delivery reports automáticos
              </p>
            </div>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                <strong>Webhook configurado:</strong> https://sms.kbagency.me/api/webhooks/bulksms-delivery
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Configuração API Token */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuração API Token
          </CardTitle>
          <CardDescription>
            Configure e teste seu API Token do BulkSMS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api-token-id">Token ID</Label>
              <Input id="api-token-id" type="text" value={apiTokenId} onChange={e => setApiTokenId(e.target.value)} placeholder="D1E7D35CB4954A62987FFD318548723D-02-2" />
              <p className="text-xs text-muted-foreground">
                Token ID do BulkSMS
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="api-token-secret">Token Secret</Label>
              <Input id="api-token-secret" type="password" value={apiTokenSecret} onChange={e => setApiTokenSecret(e.target.value)} placeholder="9kgN1b9LSovYXeKrTGBwN0bp1foiZ" />
              <p className="text-xs text-muted-foreground">
                Token Secret (opcional para teste)
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={testConnection} disabled={isTestingConnection || !apiTokenId.trim()} variant="outline">
              {isTestingConnection ? <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Testando...
                </div> : <>
                  <CheckCircle className="h-4 w-4" />
                  Testar Conexão
                </>}
            </Button>
            
            {connectionStatus === 'success' && <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Conectado
              </Badge>}
            
            {connectionStatus === 'error' && <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Erro na conexão
              </Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Card de Saldo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-500" />
                Saldo BulkSMS
              </CardTitle>
              <CardDescription>
                Saldo atual da conta BulkSMS - atualizado em tempo real
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchBalance} disabled={loadingBalance}>
              {loadingBalance ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">
            {balance !== null ? `$${balance.toFixed(2)} USD` : "Configure o API Token para ver o saldo"}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Atualizado automaticamente após cada envio
          </p>
        </CardContent>
      </Card>

      {/* Teste de SMS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Teste de Envio de SMS
          </CardTitle>
          <CardDescription>
            Envie um SMS de teste para verificar se tudo está funcionando
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-phone">Número de Telefone</Label>
              <Input id="test-phone" value={testSMS.phoneNumber} onChange={e => setTestSMS(prev => ({
              ...prev,
              phoneNumber: e.target.value
            }))} placeholder="+244912345678" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-sender">Sender ID</Label>
              <Input id="test-sender" value={testSMS.senderId} onChange={e => setTestSMS(prev => ({
              ...prev,
              senderId: e.target.value
            }))} placeholder="SMS.AO" maxLength={11} />
              <p className="text-xs text-muted-foreground">
                Alfanumérico, máximo 11 caracteres
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-message">Mensagem</Label>
            <Textarea id="test-message" value={testSMS.message} onChange={e => setTestSMS(prev => ({
            ...prev,
            message: e.target.value
          }))} placeholder="Digite sua mensagem de teste aqui..." maxLength={160} />
            <p className="text-xs text-muted-foreground">
              {testSMS.message.length}/160 caracteres
            </p>
          </div>

          <Button onClick={handleTestSMS} disabled={isTestingSMS || !testSMS.phoneNumber || !testSMS.message} className="w-full md:w-auto">
            {isTestingSMS ? <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Enviando SMS...
              </div> : <>
                <Send className="h-4 w-4" />
                Enviar SMS de Teste
              </>}
          </Button>
        </CardContent>
      </Card>

      {/* Seção de Gestão de Sender IDs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Gestão de Sender IDs
          </CardTitle>
          <CardDescription>
            Gerencie os Sender IDs aprovados para uso no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SenderIDsSection />
        </CardContent>
      </Card>
      
    </div>;
}