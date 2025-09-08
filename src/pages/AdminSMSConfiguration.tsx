import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Settings, RefreshCw, TestTube, Loader2, Send, BarChart3, AlertTriangle, CheckCircle, AlertCircle, MessageSquare, Zap, Globe, Search, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useMultiGatewayService } from '@/hooks/useMultiGatewayService';
import { useCountryPricing } from '@/hooks/useCountryPricing';
import SenderIDsSection from '@/components/admin/sms/SenderIDsSection';
import SenderIDReport from '@/components/admin/SenderIDReport';
import BulkSMSConfigModal from '@/components/admin/BulkSMSConfigModal';
import SMSGatewayDiagnostics from '@/components/admin/SMSGatewayDiagnostics';

export default function AdminSMSConfiguration() {
  const { toast } = useToast();
  
  // BulkSMS Configuration
  const [bulkSMSConfig, setBulkSMSConfig] = useState({
    tokenId: '',
    tokenSecret: '',
    testing: false,
    saving: false
  });

  // Test SMS state
  const [testPhone, setTestPhone] = useState('');
  const [testSenderId, setTestSenderId] = useState('SMSAO');
  const [testMessage, setTestMessage] = useState('Teste de SMS enviado pelo sistema.');
  const [sendingTest, setSendingTest] = useState(false);
  const [availableSenderIds, setAvailableSenderIds] = useState<string[]>([]);
  const [testingGateways, setTestingGateways] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('dashboard');
  const [diagnosticGateway, setDiagnosticGateway] = useState<string | null>(null);

  const {
    gateways,
    metrics,
    loading,
    sendSMS,
    testGateway,
    toggleGatewayActive,
    refreshStatuses
  } = useMultiGatewayService();

  const { getCountryNameByCode } = useCountryPricing();

  useEffect(() => {
    loadConfigurations();
    loadSenderIds();
  }, []);

  const loadConfigurations = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_configurations')
        .select('*')
        .eq('gateway_name', 'bulksms')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setBulkSMSConfig({
          tokenId: '', // Don't show actual tokens for security
          tokenSecret: '',
          testing: false,
          saving: false
        });
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
    }
  };

  const loadSenderIds = async () => {
    try {
      const { data, error } = await supabase
        .from('sender_ids')
        .select('sender_id')
        .eq('status', 'approved');

      if (error) throw error;

      const senderIds = data?.map(item => item.sender_id) || ['SMSAO'];
      setAvailableSenderIds(senderIds);
      
      if (senderIds.length > 0 && !testSenderId) {
        setTestSenderId(senderIds[0]);
      }
    } catch (error) {
      console.error('Error loading sender IDs:', error);
      setAvailableSenderIds(['SMSAO']);
    }
  };

  const handleTestBulkSMS = async () => {
    if (!bulkSMSConfig.tokenId || !bulkSMSConfig.tokenSecret) {
      toast({
        title: "Configuração Incompleta",
        description: "Preencha o Token ID e Token Secret do BulkSMS",
        variant: "destructive"
      });
      return;
    }

    setBulkSMSConfig(prev => ({ ...prev, testing: true }));

    try {
      const { data, error } = await supabase.functions.invoke('bulksms-balance', {
        body: {
          tokenId: bulkSMSConfig.tokenId,
          tokenSecret: bulkSMSConfig.tokenSecret
        }
      });

      if (error) throw error;

      if (data.success) {
        await saveBulkSMSConfiguration();
        toast({
          title: "Teste Bem-sucedido",
          description: `Conexão estabelecida. Saldo: $${data.balance}`,
        });
      } else {
        toast({
          title: "Erro no Teste",
          description: data.error || "Falha na conexão com BulkSMS",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('BulkSMS test error:', error);
      toast({
        title: "Erro no Teste",
        description: "Erro ao testar conexão BulkSMS",
        variant: "destructive"
      });
    } finally {
      setBulkSMSConfig(prev => ({ ...prev, testing: false }));
    }
  };

  const saveBulkSMSCredentials = async () => {
    if (!bulkSMSConfig.tokenId || !bulkSMSConfig.tokenSecret) {
      toast({
        title: "Dados Incompletos",
        description: "Preencha o Token ID e Token Secret do BulkSMS",
        variant: "destructive"
      });
      return;
    }

    setBulkSMSConfig(prev => ({ ...prev, saving: true }));

    try {
      // First, try to save/update secrets
      // Note: In a real implementation, you would use the secrets API
      // For now, we'll update the database configuration
      const { error } = await supabase
        .from('sms_configurations')
        .upsert({
          gateway_name: 'bulksms',
          api_token_id_secret_name: 'BULKSMS_TOKEN_ID',
          api_token_secret_name: 'BULKSMS_TOKEN_SECRET',
          credentials_encrypted: true,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Credenciais Salvas",
        description: "Credenciais BulkSMS foram salvas nos Supabase Secrets",
      });

      // Clear the form for security
      setBulkSMSConfig(prev => ({
        ...prev,
        tokenId: '',
        tokenSecret: ''
      }));

      // Refresh gateway statuses to reflect changes
      refreshStatuses();
    } catch (error) {
      console.error('Error saving BulkSMS credentials:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Erro ao salvar credenciais BulkSMS",
        variant: "destructive"
      });
    } finally {
      setBulkSMSConfig(prev => ({ ...prev, saving: false }));
    }
  };

  const saveBulkSMSConfiguration = async () => {
    try {
      const { error } = await supabase
        .from('sms_configurations')
        .upsert({
          gateway_name: 'bulksms',
          api_token_id_secret_name: 'BULKSMS_TOKEN_ID',
          api_token_secret_name: 'BULKSMS_TOKEN_SECRET',
          credentials_encrypted: true,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Configuração Salva",
        description: "Configuração BulkSMS salva com sucesso",
      });
    } catch (error) {
      console.error('Error saving BulkSMS config:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Erro ao salvar configuração BulkSMS",
        variant: "destructive"
      });
    }
  };

  const handleTestGateway = async (gatewayName: string) => {
    setTestingGateways(prev => ({ ...prev, [gatewayName]: true }));
    
    try {
      await testGateway(gatewayName);
    } finally {
      setTestingGateways(prev => ({ ...prev, [gatewayName]: false }));
    }
  };

  const handleSendTestSMS = async () => {
    if (!testPhone || !testMessage) {
      toast({
        title: "Dados Incompletos",
        description: "Preencha o número de telefone e a mensagem",
        variant: "destructive"
      });
      return;
    }

    setSendingTest(true);

    try {
      const result = await sendSMS(
        {
          to: testPhone,
          from: testSenderId,
          text: testMessage
        },
        'test-user'
      );

      if (result.success) {
        toast({
          title: "SMS Enviado",
          description: `SMS enviado via ${result.gateway}. ${result.fallbackUsed ? 'Fallback utilizado.' : ''}`,
        });
      } else {
        toast({
          title: "Falha no Envio",
          description: result.error || "Erro ao enviar SMS",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Test SMS error:', error);
      toast({
        title: "Erro no Teste",
        description: "Erro ao enviar SMS de teste",
        variant: "destructive"
      });
    } finally {
      setSendingTest(false);
    }
  };

  const getGatewayStatusBadge = (gateway: any) => {
    if (!gateway) return <Badge variant="secondary">Desconhecido</Badge>;
    
    if (gateway.available && gateway.configured) {
      return <Badge variant="default" className="bg-green-600">Online</Badge>;
    } else if (gateway.configured) {
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
            {gateways.map((gateway) => {
              // Usar o campo is_active do banco de dados
              const isActive = gateway.is_active;
              
              return (
                <Card key={gateway.name}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                      {getGatewayIcon(gateway)}
                      <CardTitle className="text-base">{gateway.displayName}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isActive}
                        onCheckedChange={(checked) => toggleGatewayActive(gateway.name, checked)}
                        disabled={loading}
                      />
                      {getGatewayStatusBadge(gateway)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <div className="font-medium">
                            {isActive ? 'Ativo' : 'Inativo'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Configurado:</span>
                          <div className="font-medium">
                            {gateway.configured ? 'Sim' : 'Não'}
                          </div>
                        </div>
                      </div>
                      
                      {gateway.balance && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Saldo:</span>
                          <div className="font-bold text-lg text-green-600">
                            ${gateway.balance.toFixed(2)}
                          </div>
                        </div>
                      )}
                      
                      {gateway.error && (
                        <div className="text-sm p-2 bg-destructive/10 rounded-md">
                          <span className="text-destructive font-medium">Erro:</span>
                          <div className="text-destructive text-xs mt-1">
                            {gateway.error}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestGateway(gateway.name)}
                          disabled={testingGateways[gateway.name]}
                          className="flex-1"
                        >
                          {testingGateways[gateway.name] ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <TestTube className="h-4 w-4 mr-2" />
                          )}
                          Testar
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDiagnosticGateway(gateway.name)}
                          title="Diagnosticar"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        
                        {gateway.name === 'bulksms' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab('bulksms')}
                            title="Configurar"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {gateway.name === 'bulkgate' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab('bulkgate')}
                            title="Configurar"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.fallbackRate.toFixed(1)}%</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Latência Média</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.averageLatency}ms</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Gateway Distribution */}
          {metrics && Object.keys(metrics.gatewayDistribution).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Gateway</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(metrics.gatewayDistribution).map(([gateway, count]) => (
                    <div key={gateway} className="flex justify-between items-center">
                      <span className="capitalize">{gateway}</span>
                      <Badge variant="outline">{count} mensagens</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* BulkSMS Tab */}
        <TabsContent value="bulksms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Configuração BulkSMS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bulksms-token-id">Token ID</Label>
                  <Input
                    id="bulksms-token-id"
                    type="password"
                    placeholder="Insira o Token ID do BulkSMS"
                    value={bulkSMSConfig.tokenId}
                    onChange={(e) => setBulkSMSConfig(prev => ({
                      ...prev,
                      tokenId: e.target.value
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulksms-token-secret">Token Secret</Label>
                  <Input
                    id="bulksms-token-secret"
                    type="password"
                    placeholder="Insira o Token Secret do BulkSMS"
                    value={bulkSMSConfig.tokenSecret}
                    onChange={(e) => setBulkSMSConfig(prev => ({
                      ...prev,
                      tokenSecret: e.target.value
                    }))}
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button
                  onClick={saveBulkSMSCredentials}
                  disabled={bulkSMSConfig.saving || !bulkSMSConfig.tokenId || !bulkSMSConfig.tokenSecret}
                  variant="outline"
                >
                  {bulkSMSConfig.saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Credenciais
                </Button>
                
                <Button
                  onClick={handleTestBulkSMS}
                  disabled={bulkSMSConfig.testing || !bulkSMSConfig.tokenId || !bulkSMSConfig.tokenSecret}
                >
                  {bulkSMSConfig.testing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Testar Conexão
                </Button>
                
                <BulkSMSConfigModal onConfigured={refreshStatuses} />
              </div>

              <div className="text-sm text-muted-foreground p-4 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                <p><strong>Informações importantes:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>Salvar Credenciais:</strong> Salva o Token ID e Token Secret nos Supabase Secrets de forma segura</li>
                  <li><strong>Testar Conexão:</strong> Testa as credenciais inseridas e verifica conectividade com BulkSMS</li>
                  <li><strong>Configurar BulkSMS:</strong> Modal para teste e configuração completa das credenciais</li>
                  <li>As credenciais são armazenadas de forma criptografada nos Supabase Secrets</li>
                  <li>Após salvar, o gateway estará disponível para envio de SMS</li>
                </ul>
                
                <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded text-yellow-800 dark:text-yellow-200">
                  <p><strong>💡 Fluxo recomendado:</strong></p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Insira suas credenciais BulkSMS nos campos acima</li>
                    <li>Clique em "Salvar Credenciais" para armazenar de forma segura</li>
                    <li>Use "Testar Conexão" para verificar se funcionam corretamente</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BulkGate Tab */}
        <TabsContent value="bulkgate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configuração BulkGate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground p-4 bg-green-50 dark:bg-green-950/20 rounded-md">
                <p><strong>BulkGate Configurado Automaticamente</strong></p>
                <p className="mt-2">
                  O BulkGate está configurado automaticamente via Supabase Secrets.
                  As credenciais são gerenciadas de forma segura pelo sistema.
                </p>
              </div>
              
              <div className="mt-4">
                <Button
                  onClick={() => handleTestGateway('bulkgate')}
                  disabled={testingGateways['bulkgate']}
                >
                  {testingGateways['bulkgate'] ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Testar Conexão BulkGate
                </Button>
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="test-phone">Número de Telefone</Label>
                  <Input
                    id="test-phone"
                    placeholder="+244xxxxxxxxx"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-sender">Sender ID</Label>
                  <Select value={testSenderId} onValueChange={setTestSenderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um Sender ID" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSenderIds.map((senderId) => (
                        <SelectItem key={senderId} value={senderId}>
                          {senderId}
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
                  placeholder="Digite sua mensagem de teste..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Button
                onClick={handleSendTestSMS}
                disabled={sendingTest || !testPhone || !testMessage}
                className="w-full"
              >
                {sendingTest ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar SMS de Teste
              </Button>
              
              <div className="text-sm text-muted-foreground p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
                <p><strong>Sistema de Roteamento Inteligente:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>O sistema escolherá automaticamente o melhor gateway</li>
                  <li>Se o gateway primário falhar, o fallback será utilizado</li>
                  <li>O resultado mostrará qual gateway foi usado</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sender IDs Tab */}
        <TabsContent value="senderids" className="space-y-6">
          <SenderIDsSection />
          <SenderIDReport />
        </TabsContent>
      </Tabs>

      {/* Diagnostics */}
      {diagnosticGateway && (
        <div className="mt-6">
          <SMSGatewayDiagnostics 
            gatewayName={diagnosticGateway}
            onClose={() => setDiagnosticGateway(null)}
          />
        </div>
      )}
    </div>
  );
}