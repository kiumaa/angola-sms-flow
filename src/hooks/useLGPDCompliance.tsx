import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LGPDRequest {
  id: string;
  user_id: string;
  request_type: 'data_export' | 'data_deletion' | 'data_correction' | 'consent_withdrawal' | 'data_portability';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  reason?: string;
  user_email: string;
  processed_by?: string;
  processed_at?: string;
  expires_at?: string;
  request_data?: any;
  response_data?: any;
  created_at: string;
  updated_at: string;
}

export interface ComplianceScore {
  score: number;
  total_users: number;
  users_with_consent: number;
  consent_percentage: number;
  pending_requests: number;
  overdue_requests: number;
  calculated_at: string;
}

export function useLGPDCompliance() {
  const [complianceScore, setComplianceScore] = useState<ComplianceScore | null>(null);
  const [lgpdRequests, setLgpdRequests] = useState<LGPDRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadComplianceScore(),
        loadLgpdRequests()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados de compliance:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados de compliance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadComplianceScore = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('lgpd-compliance-api/compliance-score');
      
      if (error) throw error;
      
      setComplianceScore(data);
    } catch (error) {
      console.error('Erro ao buscar score de compliance:', error);
    }
  };

  const loadLgpdRequests = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('lgpd-compliance-api/lgpd-requests');
      
      if (error) throw error;
      
      setLgpdRequests(data || []);
    } catch (error) {
      console.error('Erro ao buscar solicitações LGPD:', error);
    }
  };

  const createLgpdRequest = async (requestData: {
    requestType: string;
    reason: string;
    userEmail: string;
  }) => {
    try {
      setCreating(true);
      
      const { data, error } = await supabase.functions.invoke('lgpd-compliance-api/lgpd-requests', {
        body: requestData
      });
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Solicitação LGPD criada com sucesso",
      });
      
      await loadLgpdRequests();
      return data;
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar solicitação LGPD",
        variant: "destructive",
      });
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const processLgpdRequest = async (requestId: string, action: string, notes?: string) => {
    try {
      setProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('lgpd-compliance-api/process-request', {
        body: {
          requestId,
          action,
          notes
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: `Solicitação ${action === 'approve' ? 'aprovada' : action === 'reject' ? 'rejeitada' : 'processada'} com sucesso`,
      });
      
      await Promise.all([
        loadLgpdRequests(),
        loadComplianceScore()
      ]);
      
      return data;
    } catch (error) {
      console.error('Erro ao processar solicitação:', error);
      toast({
        title: "Erro",
        description: "Falha ao processar solicitação",
        variant: "destructive",
      });
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  const exportUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('lgpd-compliance-api/user-data', {
        body: { userId }
      });
      
      if (error) throw error;
      
      // Criar e baixar arquivo JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${userId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: "Dados do usuário exportados com sucesso",
      });
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast({
        title: "Erro",
        description: "Falha ao exportar dados do usuário",
        variant: "destructive",
      });
    }
  };

  const refreshData = () => {
    loadComplianceData();
  };

  return {
    complianceScore,
    lgpdRequests,
    loading,
    creating,
    processing,
    createLgpdRequest,
    processLgpdRequest,
    exportUserData,
    refreshData
  };
}