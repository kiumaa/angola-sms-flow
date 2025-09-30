import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SecurityConfiguration {
  rls_coverage: {
    enabled_tables: number;
    total_tables: number;
    coverage_percentage: number;
    unprotected_tables: string[];
  };
  security_functions: {
    critical_functions_available: number;
    expected_functions: number;
    all_present: boolean;
  };
  audit_logging: {
    enabled: boolean;
    recent_entries: number;
  };
  security_score: number;
  timestamp: string;
}

export const useSecurityConfiguration = () => {
  const [configuration, setConfiguration] = useState<SecurityConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAdmin } = useAuth();

  const fetchSecurityConfiguration = async () => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call the security validation function
      const { data, error: rpcError } = await supabase.rpc('validate_security_configuration');

      if (rpcError) {
        throw rpcError;
      }

      setConfiguration(data as unknown as SecurityConfiguration);
    } catch (err) {
      console.error('Error fetching security configuration:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch security configuration');
    } finally {
      setLoading(false);
    }
  };

  const getSecurityStatus = (score: number) => {
    if (score >= 90) return { status: 'excellent', color: 'green' };
    if (score >= 80) return { status: 'good', color: 'blue' };
    if (score >= 70) return { status: 'warning', color: 'yellow' };
    return { status: 'critical', color: 'red' };
  };

  const getRecommendations = (config: SecurityConfiguration) => {
    const recommendations: string[] = [];

    if (config.rls_coverage.coverage_percentage < 90) {
      recommendations.push('Ativar RLS em todas as tabelas públicas');
    }

    if (!config.security_functions.all_present) {
      recommendations.push('Implementar todas as funções de segurança críticas');
    }

    if (config.audit_logging.recent_entries < 10) {
      recommendations.push('Aumentar frequência de logs de auditoria');
    }

    if (config.rls_coverage.unprotected_tables.length > 0) {
      recommendations.push(`Proteger tabelas: ${config.rls_coverage.unprotected_tables.join(', ')}`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Configuração de segurança está otimizada');
    }

    return recommendations;
  };

  useEffect(() => {
    fetchSecurityConfiguration();
  }, [user, isAdmin]);

  return {
    configuration,
    loading,
    error,
    refetch: fetchSecurityConfiguration,
    getSecurityStatus: configuration ? getSecurityStatus(configuration.security_score) : null,
    recommendations: configuration ? getRecommendations(configuration) : []
  };
};