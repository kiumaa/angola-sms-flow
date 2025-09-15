import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Settings, TestTube, Globe, Shield, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMultiGatewayService } from '@/hooks/useMultiGatewayService';
// import { BulkSMSConfigModal } from './BulkSMSConfigModal';
import { BulkGateConfigModal } from './BulkGateConfigModal';

interface GatewayCardProps {
  id: string;
  name: 'bulksms' | 'bulkgate';
  displayName: string;
  status: 'connected' | 'disconnected' | 'error';
  isPrimary: boolean;
  isActive: boolean;
  balance?: number;
  currency?: string;
  responseTime?: number;
  error?: string;
  onConfigure: () => void;
  onTest: () => void;
  onTogglePrimary: () => void;
  onToggleActive: () => void;
}

function GatewayCard({
  id,
  name,
  displayName,
  status,
  isPrimary,
  isActive,
  balance,
  currency,
  responseTime,
  error,
  onConfigure,
  onTest,
  onTogglePrimary,
  onToggleActive
}: GatewayCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-gray-400';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (name) {
      case 'bulksms': return <Globe className="h-4 w-4" />;
      case 'bulkgate': return <Zap className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">{displayName}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {isPrimary && (
              <Badge variant="default" className="text-xs">
                Primário
              </Badge>
            )}
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-medium capitalize">{status}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ativo</p>
            <p className="font-medium">{isActive ? 'Sim' : 'Não'}</p>
          </div>
        </div>

        {balance !== undefined && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Balance</p>
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
            <Settings className="mr-1 h-3 w-3" />
            Configurar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onTest}
            disabled={status !== 'connected'}
          >
            <TestTube className="mr-1 h-3 w-3" />
            Testar
          </Button>
        </div>

        <div className="flex space-x-2">
          <Button
            size="sm"
            variant={isPrimary ? "default" : "outline"}
            onClick={onTogglePrimary}
            disabled={!isActive}
            className="flex-1"
          >
            {isPrimary ? 'Primário' : 'Definir como Primário'}
          </Button>
          <Button
            size="sm"
            variant={isActive ? "destructive" : "default"}
            onClick={onToggleActive}
          >
            {isActive ? 'Desativar' : 'Ativar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminSMSGateways() {
  const [showBulkSMSConfig, setShowBulkSMSConfig] = useState(false);
  const [showBulkGateConfig, setShowBulkGateConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const {
    gateways,
    loading,
    sendSMS,
    testGateway,
    updateGatewayPriority,
    toggleGatewayActive,
    refreshStatuses
  } = useMultiGatewayService();

  const handleTest = async (gatewayName: string) => {
    setIsLoading(true);
    try {
      const result = await testGateway(gatewayName);
      if (result) {
        toast({
          title: "Teste bem-sucedido",
          description: `Gateway ${gatewayName} está funcionando corretamente`,
        });
      } else {
        toast({
          title: "Teste falhou",
          description: `Erro ao testar ${gatewayName}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro no teste",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePrimary = async (gatewayName: string, isPrimary: boolean) => {
    try {
      await updateGatewayPriority(gatewayName, !isPrimary);
      toast({
        title: "Sucesso",
        description: `Gateway ${gatewayName} ${!isPrimary ? 'definido como primário' : 'removido como primário'}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao alterar prioridade',
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (gatewayName: string, isActive: boolean) => {
    try {
      await toggleGatewayActive(gatewayName, !isActive);
      toast({
        title: "Sucesso",
        description: `Gateway ${gatewayName} ${!isActive ? 'ativado' : 'desativado'}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Erro ao alterar status',
        variant: "destructive",
      });
    }
  };

  const handleConfigSaved = () => {
    refreshStatuses();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando gateways...</span>
      </div>
    );
  }

  const bulkSMSGateway = gateways.find(g => g.name === 'bulksms');
  const bulkGateGateway = gateways.find(g => g.name === 'bulkgate');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gateways SMS</h1>
          <p className="text-muted-foreground">
            Configure e gerencie os provedores de SMS
          </p>
        </div>
        <Button onClick={refreshStatuses} variant="outline">
          Atualizar Status
        </Button>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Configure pelo menos um gateway para enviar SMS. O BulkGate é recomendado para Angola,
          enquanto o BulkSMS é ideal para mensagens internacionais.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bulkSMSGateway && (
          <GatewayCard
            id={bulkSMSGateway.name}
            name="bulksms"
            displayName="BulkSMS"
            status={bulkSMSGateway.available ? 'connected' : 'disconnected'}
            isPrimary={bulkSMSGateway.is_primary || false}
            isActive={bulkSMSGateway.is_active || false}
            balance={bulkSMSGateway.balance}
            currency="USD"
            responseTime={bulkSMSGateway.responseTime}
            error={bulkSMSGateway.error}
            onConfigure={() => setShowBulkSMSConfig(true)}
            onTest={() => handleTest('bulksms')}
            onTogglePrimary={() => handleTogglePrimary('bulksms', bulkSMSGateway.is_primary || false)}
            onToggleActive={() => handleToggleActive('bulksms', bulkSMSGateway.is_active || false)}
          />
        )}

        {bulkGateGateway && (
          <GatewayCard
            id={bulkGateGateway.name}
            name="bulkgate"
            displayName="BulkGate"
            status={bulkGateGateway.available ? 'connected' : 'disconnected'}
            isPrimary={bulkGateGateway.is_primary || false}
            isActive={bulkGateGateway.is_active || false}
            balance={bulkGateGateway.balance}
            currency="EUR"
            responseTime={bulkGateGateway.responseTime}
            error={bulkGateGateway.error}
            onConfigure={() => setShowBulkGateConfig(true)}
            onTest={() => handleTest('bulkgate')}
            onTogglePrimary={() => handleTogglePrimary('bulkgate', bulkGateGateway.is_primary || false)}
            onToggleActive={() => handleToggleActive('bulkgate', bulkGateGateway.is_active || false)}
          />
        )}
      </div>

      {/* <BulkSMSConfigModal
        open={showBulkSMSConfig}
        onOpenChange={setShowBulkSMSConfig}
        onConfigSaved={handleConfigSaved}
      /> */}

      <BulkGateConfigModal
        open={showBulkGateConfig}
        onOpenChange={setShowBulkGateConfig}
        onConfigSaved={handleConfigSaved}
      />
    </div>
  );
}