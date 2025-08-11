import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  isLoading: boolean;
  loadTime: number | null;
  connectionSpeed: 'slow' | 'fast' | 'unknown';
}

export const usePerformance = (identifier?: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    isLoading: true,
    loadTime: null,
    connectionSpeed: 'unknown'
  });

  useEffect(() => {
    const startTime = performance.now();

    // Detect connection speed
    const connection = (navigator as any).connection;
    let connectionSpeed: 'slow' | 'fast' | 'unknown' = 'unknown';
    
    if (connection) {
      if (connection.effectiveType === '4g') {
        connectionSpeed = 'fast';
      } else if (connection.effectiveType === '3g' || connection.effectiveType === '2g') {
        connectionSpeed = 'slow';
      }
    }

    // Simulate completion
    const timer = setTimeout(() => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      setMetrics({
        isLoading: false,
        loadTime,
        connectionSpeed
      });

      // Log performance for debugging
      if (identifier && loadTime > 1000) {
        console.warn(`Slow performance detected in ${identifier}: ${loadTime}ms`);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [identifier]);

  return metrics;
};

// Hook for monitoring auth operations
export const useAuthPerformance = () => {
  const [authMetrics, setAuthMetrics] = useState({
    loginDuration: 0,
    isAuthSlow: false
  });

  const trackLogin = (startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    setAuthMetrics({
      loginDuration: duration,
      isAuthSlow: duration > 3000 // 3 seconds threshold
    });

    if (duration > 3000) {
      console.warn('Slow login detected:', duration, 'ms');
    }
  };

  return { authMetrics, trackLogin };
};

// Hook for scroll to top functionality
export const useScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return { isVisible, scrollToTop };
};