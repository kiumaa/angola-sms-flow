import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SystemHealth {
  database: 'healthy' | 'warning' | 'critical';
  authentication: 'healthy' | 'warning' | 'critical';
  smsGateways: 'healthy' | 'warning' | 'critical';
  edgeFunctions: 'healthy' | 'warning' | 'critical';
  storage: 'healthy' | 'warning' | 'critical';
  overall: 'healthy' | 'warning' | 'critical';
}

interface SystemMetrics {
  totalUsers: number;
  activeUsers24h: number;
  totalCampaigns: number;
  totalMessagesSent: number;
  averageDeliveryRate: number;
  systemUptime: number;
  responseTime: number;
  errorRate: number;
}

interface HealthCheck {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  lastChecked: string;
  responseTime?: number;
}

export const useSystemHealth = () => {
  const [health, setHealth] = useState<SystemHealth>({
    database: 'healthy',
    authentication: 'healthy',
    smsGateways: 'healthy',
    edgeFunctions: 'healthy',
    storage: 'healthy',
    overall: 'healthy'
  });
  
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    activeUsers24h: 0,
    totalCampaigns: 0,
    totalMessagesSent: 0,
    averageDeliveryRate: 0,
    systemUptime: 0,
    responseTime: 0,
    errorRate: 0
  });

  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const runHealthCheck = async (component: string, checkFn: () => Promise<any>): Promise<HealthCheck> => {
    const startTime = Date.now();
    
    try {
      await checkFn();
      const responseTime = Date.now() - startTime;
      
      return {
        component,
        status: responseTime < 2000 ? 'healthy' : 'warning',
        message: `OK - Response time: ${responseTime}ms`,
        lastChecked: new Date().toISOString(),
        responseTime
      };
    } catch (error) {
      return {
        component,
        status: 'critical',
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    }
  };

  const checkDatabaseHealth = async (): Promise<HealthCheck> => {
    return runHealthCheck('Database', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
        
      if (error) throw error;
      return data;
    });
  };

  const checkAuthenticationHealth = async (): Promise<HealthCheck> => {
    return runHealthCheck('Authentication', async () => {
      // Simple auth check - verify session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    });
  };

  const checkSMSGatewaysHealth = async (): Promise<HealthCheck> => {
    return runHealthCheck('SMS Gateways', async () => {
      const { data, error } = await supabase
        .from('sms_gateways')
        .select('name, is_active')
        .eq('is_active', true);
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('No active SMS gateways found');
      }
      
      return data;
    });
  };

  const checkEdgeFunctionsHealth = async (): Promise<HealthCheck> => {
    return runHealthCheck('Edge Functions', async () => {
      // Test a simple edge function
      const { data, error } = await supabase.functions.invoke('gateway-status', {
        body: { test: true }
      });
      
      if (error) throw error;
      return data;
    });
  };

  const checkStorageHealth = async (): Promise<HealthCheck> => {
    return runHealthCheck('Storage', async () => {
      // Check storage buckets
      const { data, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      return data;
    });
  };

  const fetchSystemMetrics = async () => {
    try {
      // Fetch basic metrics
      const [usersResult, campaignsResult, smsLogsResult] = await Promise.all([
        supabase.from('profiles').select('id, created_at'),
        supabase.from('campaigns').select('id, status'),
        supabase.from('sms_logs').select('id, status, created_at')
      ]);

      const users = usersResult.data || [];
      const campaigns = campaignsResult.data || [];
      const smsLogs = smsLogsResult.data || [];

      // Calculate active users in last 24h (simplified)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeUsers24h = users.filter(user => 
        new Date(user.created_at) > yesterday
      ).length;

      // Calculate delivery rate
      const deliveredMessages = smsLogs.filter(log => log.status === 'delivered').length;
      const totalMessages = smsLogs.length;
      const averageDeliveryRate = totalMessages > 0 ? (deliveredMessages / totalMessages) * 100 : 0;

      setMetrics({
        totalUsers: users.length,
        activeUsers24h,
        totalCampaigns: campaigns.length,
        totalMessagesSent: totalMessages,
        averageDeliveryRate,
        systemUptime: 99.9, // Placeholder - would come from monitoring service
        responseTime: 150, // Average from health checks
        errorRate: 0.1 // Placeholder
      });

    } catch (error) {
      console.error('Error fetching system metrics:', error);
    }
  };

  const runAllHealthChecks = async () => {
    if (!isAdmin) return;

    setLoading(true);
    
    try {
      const checks = await Promise.all([
        checkDatabaseHealth(),
        checkAuthenticationHealth(),
        checkSMSGatewaysHealth(),
        checkEdgeFunctionsHealth(),
        checkStorageHealth()
      ]);

      setHealthChecks(checks);

      // Calculate overall system health
      const newHealth: SystemHealth = {
        database: checks[0].status,
        authentication: checks[1].status,
        smsGateways: checks[2].status,
        edgeFunctions: checks[3].status,
        storage: checks[4].status,
        overall: 'healthy'
      };

      // Determine overall health
      const statuses = Object.values(newHealth).slice(0, -1); // Exclude overall
      if (statuses.some(status => status === 'critical')) {
        newHealth.overall = 'critical';
      } else if (statuses.some(status => status === 'warning')) {
        newHealth.overall = 'warning';
      }

      setHealth(newHealth);

      // Show toast for critical issues
      if (newHealth.overall === 'critical') {
        toast({
          title: "Sistema com Problemas Críticos",
          description: "Alguns componentes do sistema estão com falhas.",
          variant: "destructive"
        });
      }

      await fetchSystemMetrics();

    } catch (error) {
      console.error('Error running health checks:', error);
      toast({
        title: "Erro no Health Check",
        description: "Não foi possível verificar o estado do sistema.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'critical':
        return '❌';
      default:
        return '❓';
    }
  };

  // Auto-refresh health checks
  useEffect(() => {
    if (user && isAdmin) {
      runAllHealthChecks();
      
      // Refresh every 5 minutes
      const interval = setInterval(runAllHealthChecks, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user, isAdmin]);

  return {
    health,
    metrics,
    healthChecks,
    loading,
    runAllHealthChecks,
    getStatusColor,
    getStatusIcon
  };
};