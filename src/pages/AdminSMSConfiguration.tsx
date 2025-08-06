import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Send, CheckCircle, AlertTriangle, Smartphone, CreditCard, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function AdminSMSConfiguration() {
  const { toast } = useToast();
  const [isTestingSMS, setIsTestingSMS] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [bulkSMSBalance, setBulkSMSBalance] = useState<{
    balance: number;
    currency: string;
    company: string;
    lastUpdated: string;
  } | null>(null);
  
  // Test SMS
  const [testSMS, setTestSMS] = useState({
    phoneNumber: '+244',
    message: 'Teste de SMS via SMS.AO',
    senderId: 'SMSAO'
  });

  // Load BulkSMS balance on component mount
  useEffect(() => {
    loadBulkSMSBalance();
  }, []);

  const loadBulkSMSBalance = async () => {
    setIsLoadingBalance(true);
    try {
      const { data, error } = await supabase.functions.invoke('bulksms-balance');

      if (error) throw error;

      setBulkSMSBalance(data);
    } catch (error) {
      console.error('Erro ao carregar saldo BulkSMS:', error);
      toast({
        title: "Erro ao carregar saldo",
        description: "Não foi possível obter o saldo do BulkSMS",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleTestSMS = async () => {
    if (!testSMS.phoneNumber || !testSMS.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o número e a mensagem antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingSMS(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms-bulksms', {
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
        description: data.success ? 
          `SMS enviado com sucesso! Enviados: ${data.totalSent}, Falharam: ${data.totalFailed}` : 
          "Falha no envio do SMS",
        variant: data.success && data.totalSent > 0 ? "default" : "destructive",
      });

      // Reload balance after sending SMS
      if (data.success && data.totalSent > 0) {
        setTimeout(() => {
          loadBulkSMSBalance();
        }, 2000);
      }
    } catch (error) {
      console.error('Erro no envio:', error);
      toast({
        title: "Erro no envio",
        description: "Falha ao enviar SMS de teste",
        variant: "destructive",
      });
    } finally {
      setIsTestingSMS(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h1 className="text-2xl font-semibold">Configuração SMS - BulkSMS</h1>
      </div>

      {/* BulkSMS Balance Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Saldo BulkSMS
              </CardTitle>
              <CardDescription>
                Créditos disponíveis na sua conta BulkSMS
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadBulkSMSBalance}
              disabled={isLoadingBalance}
            >
              {isLoadingBalance ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bulkSMSBalance ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="text-sm text-green-800">
                    <strong>Créditos Disponíveis:</strong>
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {bulkSMSBalance.balance.toLocaleString()} {bulkSMSBalance.currency}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-800">
                    <strong>Empresa:</strong> {bulkSMSBalance.company}
                  </p>
                  <p className="text-xs text-green-600">
                    Última atualização: {new Date(bulkSMSBalance.lastUpdated).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Custo por SMS:</strong> 1 crédito por mensagem enviada
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Carregando informações do saldo...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BulkSMS Gateway Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                BulkSMS Legacy EAPI
              </CardTitle>
              <CardDescription>
                Gateway SMS principal com autenticação por API Token
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                Configurado
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-800">
                <strong>API Token Configurado:</strong> Autenticação simplificada via API Token
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Legacy EAPI:</strong> https://api-legacy2.bulksms.com/eapi (Produção)
            </p>
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
              <Input
                id="test-phone"
                value={testSMS.phoneNumber}
                onChange={(e) => setTestSMS(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="+244912345678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-sender">Sender ID</Label>
              <Input
                id="test-sender"
                value={testSMS.senderId}
                onChange={(e) => setTestSMS(prev => ({ ...prev, senderId: e.target.value }))}
                placeholder="SMS.AO"
                maxLength={11}
              />
              <p className="text-xs text-muted-foreground">
                Alfanumérico, máximo 11 caracteres
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-message">Mensagem</Label>
            <Textarea
              id="test-message"
              value={testSMS.message}
              onChange={(e) => setTestSMS(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Digite sua mensagem de teste aqui..."
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground">
              {testSMS.message.length}/160 caracteres
            </p>
          </div>

          <Button
            onClick={handleTestSMS}
            disabled={isTestingSMS || !testSMS.phoneNumber || !testSMS.message}
            className="w-full md:w-auto"
          >
            {isTestingSMS ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Enviando SMS...
              </div>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar SMS de Teste
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Informações sobre Sender IDs */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre Sender IDs com BulkSMS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              • <strong>Aprovação interna:</strong> Sistema de aprovação 100% controlado pela SMS.AO
            </p>
            <p>
              • <strong>Sem dependências externas:</strong> Não precisa aguardar aprovação de operadoras
            </p>
            <p>
              • <strong>Flexibilidade total:</strong> Qualquer Sender ID alfanumérico aprovado funciona
            </p>
            <p>
              • <strong>Delivery Reports:</strong> Recebimento automático via webhook configurado
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}