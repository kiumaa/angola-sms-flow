import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTimes: Record<string, number[]>;
  errorRates: Record<string, number>;
  cacheHitRate: number;
  memoryUsage: number;
  activeConnections: number;
}

interface OptimizationSettings {
  enableLazyLoading: boolean;
  enableImageCompression: boolean;
  enableCaching: boolean;
  batchSize: number;
  refreshInterval: number;
}

export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    apiResponseTimes: {},
    errorRates: {},
    cacheHitRate: 0,
    memoryUsage: 0,
    activeConnections: 0
  });
  
  const [settings, setSettings] = useState<OptimizationSettings>({
    enableLazyLoading: true,
    enableImageCompression: true,
    enableCaching: true,
    batchSize: 100,
    refreshInterval: 30000
  });

  const { user, isAdmin } = useAuth();

  // Track API response times
  const trackApiCall = useCallback((endpoint: string, duration: number, success: boolean) => {
    setMetrics(prev => {
      const times = prev.apiResponseTimes[endpoint] || [];
      const updatedTimes = [...times, duration].slice(-20); // Keep last 20 measurements
      
      const errors = prev.errorRates[endpoint] || 0;
      const updatedErrors = success ? errors : errors + 1;
      
      return {
        ...prev,
        apiResponseTimes: {
          ...prev.apiResponseTimes,
          [endpoint]: updatedTimes
        },
        errorRates: {
          ...prev.errorRates,
          [endpoint]: updatedErrors
        }
      };
    });
  }, []);

  // Track page load performance
  const trackPageLoad = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const loadTime = performance.now();
      setMetrics(prev => ({
        ...prev,
        pageLoadTime: loadTime
      }));
    }
  }, []);

  // Memory usage tracking (for browsers that support it)
  const trackMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / (1024 * 1024) // Convert to MB
      }));
    }
  }, []);

  // Enhanced Supabase client with performance tracking
  const createOptimizedSupabaseClient = useCallback(() => {
    const originalInvoke = supabase.functions.invoke.bind(supabase.functions);
    const originalFrom = supabase.from.bind(supabase);

    // Wrap function invocations
    supabase.functions.invoke = async (functionName: string, options?: any) => {
      const startTime = performance.now();
      try {
        const result = await originalInvoke(functionName, options);
        const duration = performance.now() - startTime;
        trackApiCall(`function_${functionName}`, duration, !result.error);
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        trackApiCall(`function_${functionName}`, duration, false);
        throw error;
      }
    };

    // Wrap table queries
    const originalFromFunction = supabase.from;
    supabase.from = (tableName: string) => {
      const table = originalFromFunction(tableName);
      const originalSelect = table.select.bind(table);
      
      table.select = (query?: string, options?: any) => {
        const startTime = performance.now();
        const promise = originalSelect(query, options);
        
        promise.then((result: any) => {
          const duration = performance.now() - startTime;
          trackApiCall(`table_${tableName}`, duration, !result.error);
        }).catch(() => {
          const duration = performance.now() - startTime;
          trackApiCall(`table_${tableName}`, duration, false);
        });
        
        return promise;
      };
      
      return table;
    };

    return supabase;
  }, [trackApiCall]);

  // Image optimization utilities
  const optimizeImage = useCallback((file: File, maxWidth = 800, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Lazy loading observer
  const createLazyLoadObserver = useCallback((callback: (entries: IntersectionObserverEntry[]) => void) => {
    if (!settings.enableLazyLoading || typeof window === 'undefined') return null;
    
    return new IntersectionObserver(callback, {
      rootMargin: '50px 0px',
      threshold: 0.01
    });
  }, [settings.enableLazyLoading]);

  // Batch operations for better performance
  const batchOperation = useCallback(async (
    items: any[], 
    operation: (batch: any[]) => Promise<any>,
    batchSize = settings.batchSize
  ) => {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const result = await operation(batch);
      results.push(result);
      
      // Small delay between batches to prevent overwhelming the server
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }, [settings.batchSize]);

  // Simple debounce utility
  const createDebounce = useCallback((delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (callback: () => void) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, delay);
    };
  }, []);

  // Performance monitoring setup
  useEffect(() => {
    if (!isAdmin) return;

    // Initial performance measurement
    trackPageLoad();
    
    // Set up periodic monitoring
    const monitoringInterval = setInterval(() => {
      trackMemoryUsage();
      
      // Calculate cache hit rate (simplified)
      const cacheSize = Object.keys(metrics.apiResponseTimes).length;
      setMetrics(prev => ({
        ...prev,
        cacheHitRate: cacheSize > 0 ? (cacheSize / (cacheSize + 10)) * 100 : 0,
        activeConnections: cacheSize // Simplified metric
      }));
    }, settings.refreshInterval);

    return () => {
      clearInterval(monitoringInterval);
    };
  }, [isAdmin, settings.refreshInterval, trackPageLoad, trackMemoryUsage]);

  // Performance optimization recommendations
  const getRecommendations = useCallback(() => {
    const recommendations: string[] = [];
    
    if (metrics.pageLoadTime > 3000) {
      recommendations.push('Considere otimizar o tempo de carregamento da página');
    }
    
    if (metrics.memoryUsage > 100) {
      recommendations.push('Uso de memória elevado - considere limpeza de cache');
    }
    
    const avgResponseTime = Object.values(metrics.apiResponseTimes)
      .flat()
      .reduce((a, b) => a + b, 0) / Object.values(metrics.apiResponseTimes).flat().length;
      
    if (avgResponseTime > 2000) {
      recommendations.push('Tempos de resposta da API estão altos');
    }
    
    if (metrics.cacheHitRate < 70) {
      recommendations.push('Taxa de cache baixa - considere otimizar caching');
    }
    
    return recommendations;
  }, [metrics]);

  return {
    metrics,
    settings,
    setSettings,
    trackApiCall,
    trackPageLoad,
    optimizeImage,
    createLazyLoadObserver,
    batchOperation,
    createDebounce,
    createOptimizedSupabaseClient,
    getRecommendations
  };
};