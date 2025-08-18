import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface GatewayStatus {
  name: string;
  display_name: string;
  status: 'online' | 'offline' | 'error' | 'testing';
  last_checked: string;
  response_time?: number;
  balance?: number;
  error_message?: string;
  is_primary: boolean;
  is_active: boolean;
  config?: {
    api_endpoint?: string;
    auth_type?: string;
  };
}

export interface GatewayMetrics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  averageResponseTime: number;
  dailyVolume: Array<{
    date: string;
    sent: number;
    delivered: number;
    failed: number;
  }>;
}

export const useGatewayMonitoring = () => {
  const [gateways, setGateways] = useState<GatewayStatus[]>([]);
  const [metrics, setMetrics] = useState<GatewayMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchGatewayStatus = async () => {
    if (!user || !isAdmin) return;

    try {
      setLoading(true);

      // Fetch gateway configurations
      const { data: gatewayConfigs, error: configError } = await supabase
        .from('sms_gateways')
        .select('*')
        .order('display_name');

      if (configError) throw configError;

      // Check status of each gateway
      const gatewayStatuses = await Promise.all(
        (gatewayConfigs || []).map(async (config) => {
          try {
            const startTime = Date.now();
            
            // Call gateway status check function
            const { data: statusData, error: statusError } = await supabase.functions.invoke('gateway-status', {
              body: { gateway_name: config.name }
            });

            const responseTime = Date.now() - startTime;

            if (statusError) {
              return {
                name: config.name,
                display_name: config.display_name,
                status: 'error' as const,
                last_checked: new Date().toISOString(),
                error_message: statusError.message,
                is_primary: config.is_primary,
                is_active: config.is_active,
                config: {
                  api_endpoint: config.api_endpoint,
                  auth_type: config.auth_type
                }
              };
            }

            return {
              name: config.name,
              display_name: config.display_name,
              status: statusData?.status || 'offline' as const,
              last_checked: new Date().toISOString(),
              response_time: responseTime,
              balance: statusData?.balance,
              is_primary: config.is_primary,
              is_active: config.is_active,
              config: {
                api_endpoint: config.api_endpoint,
                auth_type: config.auth_type
              }
            };
          } catch (error) {
            return {
              name: config.name,
              display_name: config.display_name,
              status: 'error' as const,
              last_checked: new Date().toISOString(),
              error_message: `Connection failed: ${error}`,
              is_primary: config.is_primary,
              is_active: config.is_active,
              config: {
                api_endpoint: config.api_endpoint,
                auth_type: config.auth_type
              }
            };
          }
        })
      );

      setGateways(gatewayStatuses);

      // Fetch metrics from SMS logs
      const { data: smsLogs, error: logsError } = await supabase
        .from('sms_logs')
        .select('status, created_at, gateway_used')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (logsError) {
        console.warn('Could not fetch SMS logs:', logsError);
      } else {
        const totalSent = smsLogs?.length || 0;
        const totalDelivered = smsLogs?.filter(log => log.status === 'delivered').length || 0;
        const totalFailed = smsLogs?.filter(log => log.status === 'failed').length || 0;
        const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

        // Calculate daily volume for the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentLogs = smsLogs?.filter(log => 
          new Date(log.created_at) >= sevenDaysAgo
        ) || [];

        const dailyVolumeMap = new Map<string, { sent: number; delivered: number; failed: number }>();
        
        recentLogs.forEach(log => {
          const date = log.created_at.split('T')[0];
          const existing = dailyVolumeMap.get(date) || { sent: 0, delivered: 0, failed: 0 };
          
          existing.sent++;
          if (log.status === 'delivered') existing.delivered++;
          if (log.status === 'failed') existing.failed++;
          
          dailyVolumeMap.set(date, existing);
        });

        const dailyVolume = Array.from(dailyVolumeMap.entries())
          .map(([date, stats]) => ({ date, ...stats }))
          .sort((a, b) => a.date.localeCompare(b.date));

        setMetrics({
          totalSent,
          totalDelivered,
          totalFailed,
          deliveryRate,
          averageResponseTime: gatewayStatuses.reduce((sum, g) => sum + (g.response_time || 0), 0) / gatewayStatuses.length,
          dailyVolume
        });
      }

    } catch (error) {
      console.error('Error fetching gateway status:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar status dos gateways.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testGateway = async (gatewayName: string) => {
    if (!isAdmin) return { error: 'Unauthorized' };

    try {
      toast({
        title: "Testando Gateway",
        description: "Iniciando teste de conectividade...",
      });

      const { data, error } = await supabase.functions.invoke('gateway-status', {
        body: { 
          gateway_name: gatewayName,
          test_mode: true
        }
      });

      if (error) throw error;

      toast({
        title: "Teste Concluído",
        description: `Gateway ${gatewayName}: ${data.status}`,
        variant: data.status === 'online' ? 'default' : 'destructive'
      });

      await fetchGatewayStatus(); // Refresh status

      return { success: true, data };
    } catch (error) {
      console.error('Error testing gateway:', error);
      toast({
        title: "Erro no Teste",
        description: `Falha ao testar gateway ${gatewayName}.`,
        variant: "destructive"
      });
      return { error: 'Test failed' };
    }
  };

  const setPrimaryGateway = async (gatewayName: string) => {
    if (!isAdmin) return { error: 'Unauthorized' };

    try {
      // First, set all gateways to non-primary
      const { error: resetError } = await supabase
        .from('sms_gateways')
        .update({ is_primary: false });

      if (resetError) throw resetError;

      // Then set the selected gateway as primary
      const { error: setPrimaryError } = await supabase
        .from('sms_gateways')
        .update({ is_primary: true })
        .eq('name', gatewayName);

      if (setPrimaryError) throw setPrimaryError;

      await fetchGatewayStatus(); // Refresh status

      toast({
        title: "Sucesso",
        description: `${gatewayName} definido como gateway principal.`,
      });

      return { success: true };
    } catch (error) {
      console.error('Error setting primary gateway:', error);
      toast({
        title: "Erro",
        description: "Erro ao definir gateway principal.",
        variant: "destructive"
      });
      return { error: 'Failed to set primary gateway' };
    }
  };

  const toggleGatewayStatus = async (gatewayName: string, isActive: boolean) => {
    if (!isAdmin) return { error: 'Unauthorized' };

    try {
      const { error } = await supabase
        .from('sms_gateways')
        .update({ is_active: isActive })
        .eq('name', gatewayName);

      if (error) throw error;

      await fetchGatewayStatus(); // Refresh status

      toast({
        title: "Sucesso",
        description: `Gateway ${isActive ? 'ativado' : 'desativado'} com sucesso.`,
      });

      return { success: true };
    } catch (error) {
      console.error('Error toggling gateway status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do gateway.",
        variant: "destructive"
      });
      return { error: 'Failed to toggle gateway status' };
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchGatewayStatus();
      
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(fetchGatewayStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isAdmin]);

  return {
    gateways,
    metrics,
    loading,
    testGateway,
    setPrimaryGateway,
    toggleGatewayStatus,
    refetch: fetchGatewayStatus
  };
};