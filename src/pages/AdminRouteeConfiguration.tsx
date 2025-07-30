import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Send, CheckCircle, AlertCircle, Wifi, Euro } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import RouteeProductionStatus from "@/components/admin/RouteeProductionStatus";

interface RouteeConfig {
  isActive: boolean;
  apiToken: string;
  status: 'connected' | 'error' | 'disconnected';
  balance?: number;
  lastTested?: string;
}

export default function AdminRouteeConfiguration() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingSMS, setIsTestingSMS] = useState(false);
  
  // Routee Configuration
  const [config, setConfig] = useState<RouteeConfig>({
    isActive: true,
    apiToken: '',
    status: 'disconnected'
  });

  // Test SMS
  const [testSMS, setTestSMS] = useState({
    phoneNumber: '+244',
    message: 'Teste de SMS via Routee - SMS Marketing Angola',
    senderId: 'SMS.AO'
  });

  // Load saved configuration
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('routee_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading configuration:', error);
        return;
      }

      if (settings) {
        setConfig(prev => ({
          ...prev,
          isActive: settings.is_active,
          status: settings.test_status === 'success' ? 'connected' : 
                 settings.test_status === 'error' ? 'error' : 'disconnected',
          balance: settings.balance_eur,
          lastTested: settings.last_tested_at
        }));
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  };

  const handleSaveConfig = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('routee_settings')
        .upsert({
          is_active: config.isActive,
          api_token_encrypted: config.apiToken ? btoa(config.apiToken) : null,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Configuração salva",
        description: "Configurações do Routee atualizadas com sucesso.",
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
    if (!config.apiToken) {
      toast({
        title: "Token necessário",
        description: "Insira o token da API antes de testar a conexão.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-routee-connection', {
        body: {
          apiToken: config.apiToken
        }
      });

      if (error) throw error;

      const newStatus = data.success ? 'connected' : 'error';
      
      // Salvar resultado do teste no banco
      await supabase
        .from('routee_settings')
        .upsert({
          test_status: data.success ? 'success' : 'error',
          last_tested_at: new Date().toISOString(),
          balance_eur: data.balance || 0
        });

      setConfig(prev => ({
        ...prev,
        status: newStatus,
        balance: data.balance,
        lastTested: new Date().toISOString()
      }));

      toast({
        title: "Conexão testada",
        description: data.success ? 
          "Conexão com Routee estabelecida com sucesso!" : 
          "Falha na conexão com Routee",
        variant: data.success ? "default" : "destructive",
      });
    } catch (error) {
      setConfig(prev => ({
        ...prev,
        status: 'error',
        lastTested: new Date().toISOString()
      }));

      toast({
        title: "Erro no teste",
        description: "Falha ao testar conexão com Routee",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
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
        description: data.success ? 
          `SMS enviado com sucesso via ${data.gateway}!` : 
          "Falha no envio do SMS",
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Conectado</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Desconectado</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h1 className="text-2xl font-semibold">Configuração SMS - Routee</h1>
      </div>

      {/* Routee Gateway */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Routee by AMD Telecom
              </CardTitle>
              <CardDescription>
                Gateway SMS exclusivo com Sender IDs customizáveis
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(config.status)}
              {getStatusBadge(config.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="routee-active"
              checked={config.isActive}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isActive: checked }))}
            />
            <Label htmlFor="routee-active">Gateway ativo</Label>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="routee-token">API Token</Label>
              <Input
                id="routee-token"
                type="password"
                value={config.apiToken}
                onChange={(e) => setConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                placeholder="Seu token da API Routee"
              />
            </div>

            {config.balance !== undefined && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Euro className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800">
                  Saldo disponível: €{config.balance.toFixed(2)}
                </p>
              </div>
            )}

            {config.lastTested && (
              <p className="text-xs text-muted-foreground">
                Último teste: {new Date(config.lastTested).toLocaleString('pt-BR')}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection || !config.apiToken}
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
              disabled={isLoading || !config.apiToken}
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
            disabled={isTestingSMS || !testSMS.phoneNumber || !testSMS.message || !config.isActive}
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
          <CardTitle>Sobre Sender IDs com Routee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              • <strong>Liberdade total:</strong> Use qualquer Sender ID alfanumérico de até 11 caracteres
            </p>
            <p>
              • <strong>Sem aprovação:</strong> Nenhuma burocracia ou aprovação de operadora necessária
            </p>
            <p>
              • <strong>Controle interno:</strong> Gerenciado pela SMS.AO para máxima flexibilidade
            </p>
            <p>
              • <strong>Angola otimizado:</strong> Conectividade direta e confiável para o mercado angolano
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status de Produção */}
      <RouteeProductionStatus />
    </div>
  );
}