import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IntegrityCheck {
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    total_profiles: number;
    untracked_credits: number;
    inconsistent_balances: number;
  };
  profiles_with_issues?: Array<{
    user_id: string;
    credits?: number;
    profile_credits?: number;
    adjustment_total?: number;
    issue: string;
  }>;
  recommendations: string[];
}

export const useFinancialIntegrity = () => {
  const [integrityCheck, setIntegrityCheck] = useState<IntegrityCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const checkIntegrity = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('financial-integrity-check', {
        body: { action: 'check' }
      });

      if (error) {
        toast.error('Erro ao verificar integridade financeira');
        throw error;
      }
      
      setIntegrityCheck(data);
      
      if (data.status === 'critical') {
        toast.error('Problemas críticos de integridade detectados!');
      } else if (data.status === 'warning') {
        toast.warning('Alertas de integridade encontrados');
      } else {
        toast.success('Sistema financeiro está saudável');
      }
      
    } catch (error) {
      console.error('Error checking financial integrity:', error);
    } finally {
      setLoading(false);
    }
  };

  const migrateUntrackedCredits = async () => {
    try {
      setMigrating(true);
      
      const { data, error } = await supabase.functions.invoke('financial-integrity-check', {
        body: { action: 'migrate' }
      });

      if (error) {
        toast.error('Erro ao migrar créditos não rastreados');
        throw error;
      }
      
      toast.success(`${data.migrated_count} registros de créditos migrados com sucesso`);
      
      // Refresh integrity check after migration
      await checkIntegrity();
      
    } catch (error) {
      console.error('Error migrating untracked credits:', error);
    } finally {
      setMigrating(false);
    }
  };

  return {
    integrityCheck,
    loading,
    migrating,
    checkIntegrity,
    migrateUntrackedCredits
  };
};