import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Smartphone, 
  DollarSign, 
  RefreshCw, 
  Loader2, 
  Save, 
  TestTube,
  Activity,
  Globe,
  ShieldCheck,
  AlertCircle,
  BarChart3,
  Router
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMultiGatewayService } from "@/hooks/useMultiGatewayService";
import { useCountryPricing } from "@/hooks/useCountryPricing";
import SenderIDsSection from "@/components/admin/sms/SenderIDsSection";
import SenderIDReport from "@/components/admin/SenderIDReport";

export default function AdminSMSConfiguration() {
  const { toast } = useToast();
  const { gateways, metrics, loading, sendSMS, testGateway, updateGatewayPriority, refreshStatuses } = useMultiGatewayService();
  const { pricing } = useCountryPricing();
  
  // BulkSMS Configuration
  const [bulkSMSConfig, setBulkSMSConfig] = useState({
    apiTokenId: '',
    apiTokenSecret: '',
    balance: null as number | null,
    connectionStatus: 'idle' as 'idle' | 'success' | 'error'
  });

  // Test SMS
  const [testSMS, setTestSMS] = useState({
    phoneNumber: '+244',
    message: 'Teste de SMS via SMS.AO',
    senderId: 'SMSAO'
  });

  // Loading states
  const [isTestingSMS, setIsTestingSMS] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testingGateways, setTestingGateways] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<any[]>([]);
  
  const [availableSenderIds, setAvailableSenderIds] = useState<any[]>([]);

  // Load configurations and sender IDs
  useEffect(() => {
    loadConfigurations();
    loadSenderIds();
  }, []);

  const loadConfigurations = async () => {
    try {
      // Load BulkSMS config
      const { data: bulkSMSData } = await supabase
        .from('sms_configurations')
        .select('*')
        .eq('gateway_name', 'bulksms')
        .eq('is_active', true)
        .maybeSingle();

      if (bulkSMSData) {
        setBulkSMSConfig(prev => ({
          ...prev,
          balance: bulkSMSData.balance,
          connectionStatus: 'success'
        }));
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
    }
  };

  const loadSenderIds = async () => {
    try {
      const { data, error } = await supabase
        .from('sender_ids')
        .select('*')
        .eq('status', 'approved')
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAvailableSenderIds(data || []);
    } catch (error) {
      console.error('Error loading Sender IDs:', error);
    }
  };

  const handleTestBulkSMS = async () => {
    if (!bulkSMSConfig.apiTokenId.trim()) {
      toast({
        title: "Token ID obrigatório",
        description: "Digite o API Token ID antes de testar.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('bulksms-balance', {
        body: {
          apiTokenId: bulkSMSConfig.apiTokenId.trim(),
          apiTokenSecret: bulkSMSConfig.apiTokenSecret.trim()
        }
      });

      if (error) throw error;

      if (data.success) {
        setBulkSMSConfig(prev => ({
          ...prev,
          balance: data.balance,
          connectionStatus: 'success'
        }));
        
        await saveBulkSMSConfiguration();
        
        toast({
          title: "BulkSMS conectado!",
          description: `Conexão bem-sucedida. Saldo: $${data.balance.toFixed(2)} USD`
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setBulkSMSConfig(prev => ({ ...prev, connectionStatus: 'error' }));
      toast({
        title: "Erro na conexão BulkSMS",
        description: error.message || "Falha ao conectar",
        variant: "destructive"
      });
    }
  };

  const saveBulkSMSConfiguration = async () => {
    try {
      const { error } = await supabase
        .from('sms_configurations')
        .upsert({
          gateway_name: 'bulksms',
          api_token_id: bulkSMSConfig.apiTokenId.trim(),
          api_token_secret: bulkSMSConfig.apiTokenSecret.trim(),
          is_active: true,
          balance: bulkSMSConfig.balance,
          last_balance_check: new Date().toISOString()
        }, {
          onConflict: 'gateway_name'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving BulkSMS configuration:', error);
    }
  };

  const handleTestGateway = async (gatewayName: string) => {
    setTestingGateways(prev => ({ ...prev, [gatewayName]: true }));
    
    try {
      const result = await testGateway(gatewayName);
      
      if (result) {
        toast({
          title: "Teste concluído",
          description: `Gateway ${gatewayName} testado com sucesso`
        });
      }
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTestingGateways(prev => ({ ...prev, [gatewayName]: false }));
    }
  };

  const handleSendTestSMS = async () => {
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
      const result = await sendSMS({
        to: testSMS.phoneNumber,
        from: testSMS.senderId,
        text: testSMS.message
      }, 'test-user');

      setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results

      toast({
        title: result.success ? "SMS enviado!" : "Falha no envio",
        description: result.success 
          ? `SMS enviado via ${result.gateway}` 
          : result.error,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Erro no envio",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsTestingSMS(false);
    }
  };

  const getGatewayStatusBadge = (gateway: any) => {
    if (!gateway) return <Badge variant="secondary">Desconhecido</Badge>;
    
    if (gateway.available && gateway.configured) {
      return <Badge variant="default" className="bg-green-600">Online</Badge>;
    } else if (gateway.configured && !gateway.available) {
      return <Badge variant="destructive">Offline</Badge>;
    } else {
      return <Badge variant="secondary">Não Configurado</Badge>;
    }
  };

  const getGatewayIcon = (gateway: any) => {
    if (!gateway) return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    
    if (gateway.available && gateway.configured) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else {
      return <AlertTriangle className="h-5 w-5 text-destructive" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h1 className="text-2xl font-semibold">Hub de Gestão SMS</h1>
        </div>
        <Button onClick={refreshStatuses} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar Status
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="bulksms">BulkSMS</TabsTrigger>
          <TabsTrigger value="bulkgate">BulkGate</TabsTrigger>
          <TabsTrigger value="testing">Testes</TabsTrigger>
          <TabsTrigger value="senderids">Sender IDs</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Gateway Status Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {gateways.map((gateway) => (
              <Card key={gateway.name}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-2">
                    {getGatewayIcon(gateway)}
                    <CardTitle className="text-base">{gateway.name}</CardTitle>
                  </div>
                  {getGatewayStatusBadge(gateway)}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {gateway.balance && (
                      <div className="flex justify-between text-sm">
                        <span>Saldo:</span>
                        <span className="font-medium">${gateway.balance.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>Configurado:</span>
                      <span>{gateway.configured ? 'Sim' : 'Não'}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestGateway(gateway.name)}
                      disabled={testingGateways[gateway.name]}
                      className="w-full mt-2"
                    >
                      {testingGateways[gateway.name] ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <TestTube className="h-4 w-4 mr-2" />
                      )}
                      Testar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Metrics Overview */}
          {metrics && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Enviado</CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalSent}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Fallback</CardTitle>
                  <Router className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.fallbackRate.toFixed(1)}%</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gateways Ativos</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {gateways.filter(g => g.available && g.configured).length}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* System Health Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Resumo do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Gateways Configurados:</span>
                    <span className="font-medium">{gateways.filter(g => g.configured).length}/{gateways.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Gateways Online:</span>
                    <span className="font-medium">{gateways.filter(g => g.available).length}/{gateways.length}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Gateway Primário:</span>
                    <span className="font-medium">BulkSMS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Fallback Ativo:</span>
                    <span className="font-medium">Sim</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BulkSMS Configuration Tab */}
        <TabsContent value="bulksms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Configuração BulkSMS
              </CardTitle>
              <CardDescription>
                Configure as credenciais do gateway BulkSMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulksms-token-id">Token ID</Label>
                  <Input
                    id="bulksms-token-id"
                    type="text"
                    value={bulkSMSConfig.apiTokenId}
                    onChange={(e) => setBulkSMSConfig(prev => ({ ...prev, apiTokenId: e.target.value }))}
                    placeholder="D1E7D35CB4954A62987FFD318548723D-02-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bulksms-token-secret">Token Secret</Label>
                  <Input
                    id="bulksms-token-secret"
                    type="password"
                    value={bulkSMSConfig.apiTokenSecret}
                    onChange={(e) => setBulkSMSConfig(prev => ({ ...prev, apiTokenSecret: e.target.value }))}
                    placeholder="9kgN1b9LSovYXeKrTGBwN0bp1foiZ"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button onClick={handleTestBulkSMS} variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Testar & Salvar
                </Button>
                
                {bulkSMSConfig.connectionStatus === 'success' && (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                )}
                
                {bulkSMSConfig.connectionStatus === 'error' && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Erro na conexão
                  </Badge>
                )}
              </div>

              {bulkSMSConfig.balance !== null && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Saldo: ${bulkSMSConfig.balance.toFixed(2)} USD</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BulkGate Configuration Tab */}
        <TabsContent value="bulkgate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configuração BulkGate
              </CardTitle>
              <CardDescription>
                Configure as credenciais do gateway BulkGate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    BulkGate é configurado automaticamente via secrets do Supabase (BULKGATE_API_KEY)
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Status da Configuração</h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Gateway Status:</span>
                    <Badge variant="secondary">Configuração Automática</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing Tab */}
        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Teste de Envio SMS
              </CardTitle>
              <CardDescription>
                Teste o envio de SMS com roteamento inteligente
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
                  <Select
                    value={testSMS.senderId}
                    onValueChange={(value) => setTestSMS(prev => ({ ...prev, senderId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar Sender ID" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SMSAO">
                        <div className="flex items-center gap-2">
                          SMSAO
                          <Badge variant="secondary" className="text-xs">Padrão</Badge>
                        </div>
                      </SelectItem>
                      {availableSenderIds.map((senderId) => (
                        <SelectItem key={senderId.id} value={senderId.sender_id}>
                          <div className="flex items-center gap-2">
                            {senderId.sender_id}
                            {senderId.is_default && (
                              <Badge variant="secondary" className="text-xs">Padrão</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-message">Mensagem</Label>
                <Textarea
                  id="test-message"
                  value={testSMS.message}
                  onChange={(e) => setTestSMS(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Digite sua mensagem de teste aqui..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleSendTestSMS}
                disabled={isTestingSMS}
                className="w-full"
              >
                {isTestingSMS ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar Teste com Roteamento Inteligente
              </Button>

              {/* Test Results */}
              {testResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Resultados dos Testes</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {testResults.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded border text-sm ${
                          result.success
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{result.success ? 'Sucesso' : 'Falha'}</span>
                          <span className="text-xs">{new Date().toLocaleTimeString()}</span>
                        </div>
                        {result.gateway && (
                          <div className="text-xs">Gateway: {result.gateway}</div>
                        )}
                        {result.error && (
                          <div className="text-xs mt-1">{result.error}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sender IDs Tab */}
        <TabsContent value="senderids" className="space-y-6">
          <SenderIDsSection />
          <SenderIDReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}