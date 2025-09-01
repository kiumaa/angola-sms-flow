import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface GatewayStatus {
  name: string;
  displayName: string;
  available: boolean;
  configured: boolean;
  balance?: number;
  responseTime?: number;
  errorRate?: number;
  lastChecked?: string;
  error?: string;
}

export interface RoutingMetrics {
  totalSent: number;
  gatewayDistribution: Record<string, number>;
  fallbackRate: number;
  averageLatency: number;
  successRate: number;
  countryDistribution: Record<string, number>;
}

export interface SMSDispatchResult {
  success: boolean;
  messageId?: string;
  gateway: string;
  fallbackUsed: boolean;
  attempts: Array<{
    gateway: string;
    success: boolean;
    timestamp: string;
    error?: string;
  }>;
  cost?: number;
  error?: string;
}

export const useMultiGatewayService = () => {
  const [gateways, setGateways] = useState<GatewayStatus[]>([]);
  const [metrics, setMetrics] = useState<RoutingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGatewayStatuses = async () => {
    try {
      setLoading(true);

      // Get gateway configurations
      const { data: gatewayConfigs, error: configError } = await supabase
        .from('sms_gateways')
        .select('*')
        .eq('is_active', true);

      if (configError) throw configError;

      // Check status of each gateway via edge function
      const gatewayStatuses: GatewayStatus[] = [];
      
      for (const config of gatewayConfigs || []) {
        try {
          const { data: statusData, error: statusError } = await supabase.functions
            .invoke('gateway-status', {
              body: { 
                gateway_name: config.name,
                test_mode: true 
              }
            });

          if (statusError) throw statusError;

          gatewayStatuses.push({
            name: config.name,
            displayName: config.display_name,
            available: statusData?.status === 'online',
            configured: true,
            balance: statusData?.balance,
            responseTime: statusData?.response_time,
            lastChecked: new Date().toISOString(),
            error: statusData?.error
          });
        } catch (error) {
          gatewayStatuses.push({
            name: config.name,
            displayName: config.display_name,
            available: false,
            configured: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            lastChecked: new Date().toISOString()
          });
        }
      }

      setGateways(gatewayStatuses);

      // Fetch routing metrics from SMS logs
      await fetchMetrics();

    } catch (error) {
      console.error('Error fetching gateway statuses:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar status dos gateways.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      // Get recent SMS logs for metrics
      const { data: logs, error } = await supabase
        .from('sms_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      if (logs && logs.length > 0) {
        const totalSent = logs.length;
        const successfulSent = logs.filter(log => log.status === 'sent' || log.status === 'delivered').length;
        const fallbackUsed = logs.filter(log => log.fallback_attempted).length;

        // Gateway distribution
        const gatewayDistribution: Record<string, number> = {};
        logs.forEach(log => {
          const gateway = log.gateway_used || 'unknown';
          gatewayDistribution[gateway] = (gatewayDistribution[gateway] || 0) + 1;
        });

        // Country distribution
        const countryDistribution: Record<string, number> = {};
        logs.forEach(log => {
          const country = log.country_code || 'unknown';
          countryDistribution[country] = (countryDistribution[country] || 0) + 1;
        });

        setMetrics({
          totalSent,
          gatewayDistribution,
          fallbackRate: totalSent > 0 ? (fallbackUsed / totalSent) * 100 : 0,
          averageLatency: 0, // Would need to calculate from logs
          successRate: totalSent > 0 ? (successfulSent / totalSent) * 100 : 0,
          countryDistribution
        });
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const sendSMS = async (
    message: { to: string; from: string; text: string; },
    userId: string
  ): Promise<SMSDispatchResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('sms-gateway-dispatcher', {
        body: {
          message,
          userId
        }
      });

      if (error) throw error;

      // Refresh metrics after sending
      await fetchMetrics();

      return {
        success: data.finalResult.success,
        messageId: data.finalResult.messageId,
        gateway: data.finalResult.gateway,
        fallbackUsed: data.fallbackUsed,
        attempts: data.attempts.map((attempt: any) => ({
          gateway: attempt.gateway,
          success: attempt.result.success,
          timestamp: attempt.timestamp,
          error: attempt.result.error
        })),
        cost: data.finalResult.cost,
        error: data.finalResult.error
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  };

  const testGateway = async (gatewayName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('gateway-status', {
        body: { 
          gateway_name: gatewayName,
          test_mode: true 
        }
      });

      if (error) throw error;

      toast({
        title: "Teste de Gateway",
        description: `${gatewayName}: ${data.status === 'online' ? 'Online' : 'Offline'}`,
        variant: data.status === 'online' ? 'default' : 'destructive'
      });

      // Refresh statuses
      await fetchGatewayStatuses();

      return data.status === 'online';
    } catch (error) {
      console.error('Error testing gateway:', error);
      toast({
        title: "Erro no Teste",
        description: `Erro ao testar ${gatewayName}`,
        variant: "destructive"
      });
      return false;
    }
  };

  const updateGatewayPriority = async (gatewayName: string, isPrimary: boolean) => {
    try {
      const { error } = await supabase
        .from('sms_gateways')
        .update({ is_primary: isPrimary })
        .eq('name', gatewayName);

      if (error) throw error;

      if (isPrimary) {
        // Set all other gateways to non-primary
        await supabase
          .from('sms_gateways')
          .update({ is_primary: false })
          .neq('name', gatewayName);
      }

      toast({
        title: "Gateway Atualizado",
        description: `${gatewayName} ${isPrimary ? 'definido como primário' : 'removido como primário'}`,
      });

      await fetchGatewayStatuses();
    } catch (error) {
      console.error('Error updating gateway priority:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar prioridade do gateway",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchGatewayStatuses();

    // Set up periodic refresh
    const interval = setInterval(fetchGatewayStatuses, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return {
    gateways,
    metrics,
    loading,
    sendSMS,
    testGateway,
    updateGatewayPriority,
    refreshStatuses: fetchGatewayStatuses
  };
};