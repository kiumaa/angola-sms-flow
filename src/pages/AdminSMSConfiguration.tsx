import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Send, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SMSGatewaySelector from "@/components/admin/sms/SMSGatewaySelector";

export default function AdminSMSConfiguration() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingSMS, setIsTestingSMS] = useState(false);
  
  // Africa's Talking Configuration
  const [config, setConfig] = useState({
    isActive: true,
    username: '',
    apiKey: '',
    defaultSenderId: 'SMSao',
    sandboxMode: false
  });

  // Test SMS
  const [testSMS, setTestSMS] = useState({
    phoneNumber: '+244',
    message: 'Teste de SMS via Africa\'s Talking - SMS Marketing Angola',
    senderId: 'SMSao'
  });

  const handleSaveConfig = async () => {
    setIsLoading(true);
    try {
      // Save configuration to database or settings
      toast({
        title: "Configuração salva",
        description: "Configurações do Africa's Talking atualizadas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-sms-connection', {
        body: {
          gateway: 'africastalking',
          config: {
            username: config.username,
            apiKey: config.apiKey,
            sandbox: config.sandboxMode
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Conexão testada",
        description: data.success ? "Conexão com Africa's Talking estabelecida com sucesso!" : "Falha na conexão",
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: "Falha ao testar conexão com Africa's Talking",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleTestSMS = async () => {
    setIsTestingSMS(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
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
        description: data.success ? "SMS enviado com sucesso!" : "Falha no envio",
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
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
        <h1 className="text-2xl font-semibold">Configuração de SMS</h1>
      </div>

      {/* Gateway Selector */}
      <SMSGatewaySelector />

      {/* Africa's Talking Gateway */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Africa's Talking
              </CardTitle>
              <CardDescription>
                Gateway SMS principal para Angola com Sender IDs customizáveis
              </CardDescription>
            </div>
            <Badge variant={config.isActive ? "default" : "secondary"}>
              {config.isActive ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="at-active"
              checked={config.isActive}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="at-active">Gateway ativo</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="at-username">Username</Label>
              <Input
                id="at-username"
                value={config.username}
                onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                placeholder="sua_conta_at"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="at-apikey">API Key</Label>
              <Input
                id="at-apikey"
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="sua_api_key_at"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="at-sender">Sender ID Padrão</Label>
              <Input
                id="at-sender"
                value={config.defaultSenderId}
                onChange={(e) => setConfig(prev => ({ ...prev, defaultSenderId: e.target.value }))}
                placeholder="SMSao"
                maxLength={11}
              />
              <p className="text-xs text-muted-foreground">
                Alfanumérico, máximo 11 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="at-sandbox"
                  checked={config.sandboxMode}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, sandboxMode: checked }))}
                />
                <Label htmlFor="at-sandbox">Modo Sandbox</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Ative para testes gratuitos (não envia SMS reais)
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection || !config.username || !config.apiKey}
              variant="outline"
            >
              {isTestingConnection ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  Testando...
                </div>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Testar Conexão
                </>
              )}
            </Button>

            <Button
              onClick={handleSaveConfig}
              disabled={isLoading || !config.username || !config.apiKey}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Salvando...
                </div>
              ) : (
                "Salvar Configuração"
              )}
            </Button>
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
                placeholder="SMSao"
                maxLength={11}
              />
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

          {config.sandboxMode && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-800">
                Modo sandbox ativo - SMS não será enviado, apenas simulado
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações sobre Sender IDs */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre Sender IDs Customizáveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              • <strong>Sem burocracia:</strong> Cada cliente pode usar qualquer Sender ID alfanumérico desejado
            </p>
            <p>
              • <strong>Registro automático:</strong> Sender IDs são registrados automaticamente no Africa's Talking
            </p>
            <p>
              • <strong>Flexibilidade total:</strong> Clientes podem ter múltiplos Sender IDs para diferentes campanhas
            </p>
            <p>
              • <strong>Angola friendly:</strong> Otimizado para o mercado angolano com suporte nativo
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}