import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HealthCheckResult {
  timestamp: string;
  system_status: 'healthy' | 'warning' | 'critical';
  metrics: {
    total_users: number;
    active_sms_configs: number;
    pending_credit_requests: number;
    failed_sms_24h: number;
    orphaned_data: number;
  };
  recommendations: string[];
}

interface PerformanceMetrics {
  responseTime: number;
  activeConnections: number;
  errorRate: number;
  lastChecked: Date;
}

export function useProductionMonitoring() {
  const [healthStatus, setHealthStatus] = useState<HealthCheckResult | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkSystemHealth = async () => {
    try {
      const { data, error } = await supabase.rpc('production_system_health_check');
      
      if (error) throw error;
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const result = data as unknown as HealthCheckResult;
        setHealthStatus(result);
        
        // Alert on critical status
        if (result.system_status === 'critical') {
          toast({
            title: "Sistema em Estado Crítico",
            description: "Ação imediata necessária. Verifique os alertas.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const measurePerformance = async () => {
    const start = performance.now();
    
    try {
      await supabase.from('profiles').select('count').limit(1).single();
      const responseTime = performance.now() - start;
      
      setPerformanceMetrics({
        responseTime,
        activeConnections: navigator.onLine ? 1 : 0,
        errorRate: 0,
        lastChecked: new Date(),
      });
    } catch (error) {
      console.error('Performance measurement failed:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        checkSystemHealth(),
        measurePerformance(),
      ]);
      setLoading(false);
    };

    init();

    // Check health every 5 minutes
    const healthInterval = setInterval(checkSystemHealth, 5 * 60 * 1000);
    
    // Measure performance every minute
    const perfInterval = setInterval(measurePerformance, 60 * 1000);

    return () => {
      clearInterval(healthInterval);
      clearInterval(perfInterval);
    };
  }, []);

  return {
    healthStatus,
    performanceMetrics,
    loading,
    refetchHealth: checkSystemHealth,
    refetchPerformance: measurePerformance,
  };
}
