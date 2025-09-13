import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface GatewayOverride {
  id: string;
  override_type: 'none' | 'force_bulksms' | 'force_bulkgate';
  is_active: boolean;
  expires_at?: string;
  created_by: string;
  created_at: string;
  reason?: string;
}

export const useGatewayOverride = () => {
  const [override, setOverride] = useState<GatewayOverride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();

  const fetchActiveOverride = async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('gateway_overrides')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setOverride(data as GatewayOverride);
    } catch (err: any) {
      console.error('Error fetching gateway override:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setGatewayOverride = async (
    overrideType: 'none' | 'force_bulksms' | 'force_bulkgate',
    expiresAt?: Date,
    reason?: string
  ) => {
    if (!isAdmin || !user) {
      throw new Error('Unauthorized: Only admins can set gateway overrides');
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('set_gateway_override', {
        _override_type: overrideType,
        _expires_at: expiresAt?.toISOString() || null,
        _reason: reason || null
      });

      if (error) throw error;

      // Refresh the active override
      await fetchActiveOverride();
      
      return data;
    } catch (err: any) {
      console.error('Error setting gateway override:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getActiveOverrideType = async (): Promise<string> => {
    try {
      const { data, error } = await supabase.rpc('get_active_gateway_override');
      
      if (error) throw error;
      
      return data || 'none';
    } catch (err: any) {
      console.error('Error getting active override type:', err);
      return 'none';
    }
  };

  const clearOverride = async () => {
    return setGatewayOverride('none');
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchActiveOverride();

      // Set up real-time subscription
      const subscription = supabase
        .channel('gateway_overrides_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'gateway_overrides'
          },
          () => {
            fetchActiveOverride();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, [user, isAdmin]);

  return {
    override,
    loading,
    error,
    setGatewayOverride,
    getActiveOverrideType,
    clearOverride,
    refetch: fetchActiveOverride
  };
};