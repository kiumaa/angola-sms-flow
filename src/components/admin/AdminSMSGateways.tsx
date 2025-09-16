import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Settings, TestTube, Globe, Shield, Zap, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BulkGateConfigModal } from './BulkGateConfigModal';
import { supabase } from '@/integrations/supabase/client';

interface GatewayStatus {
  name: string;
  status: 'online' | 'offline' | 'error';
  balance?: number;
  currency?: string;
  responseTime?: number;
  error?: string;
  is_active?: boolean;
  is_primary?: boolean;
}

interface GatewayCardProps {
  name: string;
  displayName: string;
  status: 'online' | 'offline' | 'error';
  isPrimary: boolean;
  isActive: boolean;
  balance?: number;
  currency?: string;
  responseTime?: number;
  error?: string;
  onConfigure: () => void;
  onTest: () => void;
}

function GatewayCard({
  name,
  displayName,
  status,
  isPrimary,
  isActive,
  balance,
  currency = 'EUR',
  responseTime,
  error,
  onConfigure,
  onTest
}: GatewayCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800 border-green-200';
      case 'offline': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Globe className="h-4 w-4" />;
      case 'offline': return <Zap className="h-4 w-4" />;
      case 'error': return <Shield className="h-4 w-4" />;
      default: return <TestTube className="h-4 w-4" />;
    }
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{displayName}</CardTitle>
          <div className="flex gap-2">
            {isPrimary && (
              <Badge variant="default" className="text-xs">
                Primário
              </Badge>
            )}
            <Badge 
              variant="outline" 
              className={`text-xs ${getStatusColor(status)}`}
            >
              {getStatusIcon(status)}
              <span className="ml-1 capitalize">
                {status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Erro'}
              </span>
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium capitalize">{status === 'online' ? 'Ativo' : 'Inativo'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Configurado</p>
            <p className="font-medium">{isActive ? 'Sim' : 'Não'}</p>
          </div>
        </div>

        {balance !== undefined && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Saldo</p>
              <p className="font-medium">{balance} {currency}</p>
            </div>
            {responseTime && (
              <div>
                <p className="text-muted-foreground">Latência</p>
                <p className="font-medium">{responseTime}ms</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onConfigure}
            className="flex-1"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onTest}
            disabled={status !== 'online'}
            className="flex-1"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Testar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminSMSGateways() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bulkSMSStatus, setBulkSMSStatus] = useState<GatewayStatus | null>(null);
  const [bulkGateStatus, setBulkGateStatus] = useState<GatewayStatus | null>(null);
  const [showBulkGateConfig, setShowBulkGateConfig] = useState(false);

  useEffect(() => {
    loadGatewayStatuses();
  }, []);

  const loadGatewayStatuses = async () => {
    try {
      setLoading(true);
      
      // Get gateway configurations from database
      const { data: gatewayConfigs } = await supabase
        .from('sms_gateways')
        .select('*');

      // Test each gateway status
      await Promise.all([
        testGatewayStatus('bulksms'),
        testGatewayStatus('bulkgate')
      ]);

    } catch (error) {
      console.error('Error loading gateway statuses:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar status dos gateways",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testGatewayStatus = async (gatewayName: string) => {
    try {
      const response = await supabase.functions.invoke('gateway-status', {
        body: { gateway_name: gatewayName, test_mode: true }
      });

      if (response.data) {
        const status: GatewayStatus = {
          name: gatewayName,
          status: response.data.status === 'online' ? 'online' : response.data.status === 'error' ? 'error' : 'offline',
          balance: response.data.balance,
          currency: gatewayName === 'bulksms' ? 'USD' : 'EUR',
          responseTime: response.data.response_time,
          error: response.data.error,
          is_active: true,
          is_primary: gatewayName === 'bulkgate'
        };

        if (gatewayName === 'bulksms') {
          setBulkSMSStatus(status);
        } else {
          setBulkGateStatus(status);
        }
      }
    } catch (error) {
      console.error(`Error testing ${gatewayName}:`, error);
    }
  };

  const handleTest = async (gatewayName: string) => {
    await testGatewayStatus(gatewayName);
    toast({
      title: "Teste realizado",
      description: `Status do ${gatewayName} atualizado`,
    });
  };

  const handleConfigSaved = () => {
    loadGatewayStatuses();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando gateways...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gateways SMS</h1>
          <p className="text-muted-foreground">
            Configure e gerencie os provedores de SMS
          </p>
        </div>
        <Button onClick={loadGatewayStatuses} variant="outline">
          <TestTube className="h-4 w-4 mr-2" />
          Atualizar Status
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BulkGate Gateway */}
        {bulkGateStatus && (
          <GatewayCard
            name="bulkgate"
            displayName="BulkGate"
            status={bulkGateStatus.status}
            isPrimary={bulkGateStatus.is_primary || false}
            isActive={bulkGateStatus.is_active || false}
            balance={bulkGateStatus.balance}
            currency={bulkGateStatus.currency}
            responseTime={bulkGateStatus.responseTime}
            error={bulkGateStatus.error}
            onConfigure={() => setShowBulkGateConfig(true)}
            onTest={() => handleTest('bulkgate')}
          />
        )}

        {/* BulkSMS Gateway */}
        {bulkSMSStatus && (
          <GatewayCard
            name="bulksms"
            displayName="BulkSMS"
            status={bulkSMSStatus.status}
            isPrimary={bulkSMSStatus.is_primary || false}
            isActive={bulkSMSStatus.is_active || false}
            balance={bulkSMSStatus.balance}
            currency={bulkSMSStatus.currency}
            responseTime={bulkSMSStatus.responseTime}
            error={bulkSMSStatus.error}
            onConfigure={() => {
              toast({
                title: "Em desenvolvimento",
                description: "Configuração BulkSMS em breve",
              });
            }}
            onTest={() => handleTest('bulksms')}
          />
        )}
      </div>
      
      {/* Alerta específico para BulkGate com problemas */}
      {bulkGateStatus && bulkGateStatus.error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p><strong>BulkGate com erro:</strong> {bulkGateStatus.error}</p>
              <div className="bg-destructive/10 p-3 rounded text-sm">
                <p className="font-medium mb-2">💡 Soluções possíveis:</p>
                <ul className="space-y-1 list-disc list-inside text-xs">
                  <li>Verificar formato das credenciais: <code>applicationId:applicationToken</code></li>
                  <li>Ou verificar token Bearer (v2 API) se aplicável</li>
                  <li>Confirmar conta BulkGate ativa com créditos</li>
                  <li>Testar credenciais no painel BulkGate</li>
                </ul>
              </div>
              <Button 
                onClick={() => setShowBulkGateConfig(true)}
                size="sm" 
                className="w-full sm:w-auto"
              >
                <Settings className="h-4 w-4 mr-2" />
                Reconfigurar BulkGate
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <BulkGateConfigModal
        open={showBulkGateConfig}
        onOpenChange={setShowBulkGateConfig}
        onConfigSaved={handleConfigSaved}
      />
    </div>
  );
}

export default AdminSMSGateways;