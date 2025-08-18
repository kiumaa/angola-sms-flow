import { useState, useEffect, useRef } from "react";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class InMemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const timeToLive = ttl || this.defaultTTL;
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + timeToLive
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getSize(): number {
    return this.cache.size;
  }

  // Cleanup expired items
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton cache instance
const cache = new InMemoryCache();

// Cleanup expired items every 10 minutes
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean; // Return stale data while revalidating
  key?: string; // Custom cache key
}

export function useCache<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[],
  options: CacheOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  // Generate cache key from dependencies and custom key
  const cacheKey = options.key || `cache_${JSON.stringify(dependencies)}`;

  const fetchData = async (useCache = true) => {
    try {
      setError(null);
      
      // Check cache first
      if (useCache) {
        const cachedData = cache.get<T>(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          setIsStale(false);
          return cachedData;
        }
      }

      // If staleWhileRevalidate and we have stale data, use it while fetching
      if (options.staleWhileRevalidate && data) {
        setIsStale(true);
      } else {
        setLoading(true);
      }

      const result = await fetchFnRef.current();
      
      // Cache the result
      cache.set(cacheKey, result, options.ttl);
      
      setData(result);
      setIsStale(false);
      setLoading(false);
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setLoading(false);
      setIsStale(false);
      throw error;
    }
  };

  const invalidate = () => {
    cache.invalidate(cacheKey);
    setIsStale(true);
  };

  const refresh = () => {
    return fetchData(false); // Force refresh, skip cache
  };

  // Initial load and dependency changes
  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    data,
    loading,
    error,
    isStale,
    refresh,
    invalidate
  };
}

// Hook for manual cache operations
export function useCacheOperations() {
  return {
    set: cache.set.bind(cache),
    get: cache.get.bind(cache),
    has: cache.has.bind(cache),
    invalidate: cache.invalidate.bind(cache),
    invalidatePattern: cache.invalidatePattern.bind(cache),
    clear: cache.clear.bind(cache),
    getSize: cache.getSize.bind(cache)
  };
}

// Optimized query cache for Supabase
export function useQueryCache<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: CacheOptions & {
    enabled?: boolean;
    refetchInterval?: number;
    refetchOnWindowFocus?: boolean;
  } = {}
) {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    enabled = true,
    refetchInterval,
    refetchOnWindowFocus = true
  } = options;

  const cacheKey = `query_${queryKey.join('_')}`;
  const intervalRef = useRef<NodeJS.Timeout>();
  const windowFocusRef = useRef<() => void>();

  const {
    data,
    loading,
    error,
    isStale,
    refresh,
    invalidate
  } = useCache(queryFn, queryKey, { ttl, key: cacheKey, ...options });

  // Auto refresh interval
  useEffect(() => {
    if (refetchInterval && enabled && !loading) {
      intervalRef.current = setInterval(refresh, refetchInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [refetchInterval, enabled, loading, refresh]);

  // Refetch on window focus
  useEffect(() => {
    if (refetchOnWindowFocus && enabled) {
      const handleFocus = () => {
        if (!loading && document.visibilityState === 'visible') {
          refresh();
        }
      };

      windowFocusRef.current = handleFocus;
      document.addEventListener('visibilitychange', handleFocus);
      window.addEventListener('focus', handleFocus);

      return () => {
        document.removeEventListener('visibilitychange', handleFocus);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [refetchOnWindowFocus, enabled, loading, refresh]);

  // Disable queries when not enabled
  if (!enabled) {
    return {
      data: null,
      loading: false,
      error: null,
      isStale: false,
      refresh: () => Promise.resolve(null),
      invalidate: () => {}
    };
  }

  return {
    data,
    loading,
    error,
    isStale,
    refresh,
    invalidate
  };
}

export default cache;