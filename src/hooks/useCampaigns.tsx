import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface Campaign {
  id: string;
  name: string;
  message_template: string;
  status: string;
  total_targets: number;
  est_credits: number;
  schedule_at: string | null;
  created_at: string;
  updated_at: string;
  sender_id: string | null;
  // Join with stats
  stats?: {
    sent: number;
    delivered: number;
    failed: number;
    credits_spent: number;
  };
}

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCampaigns = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_stats (
            sent,
            delivered,
            failed,
            credits_spent
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar campanhas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (campaignData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('campaigns-api', {
        body: {
          ...campaignData,
          action: 'create'
        }
      });

      if (error) throw error;
      
      await fetchCampaigns(); // Refresh list
      
      toast({
        title: "Sucesso",
        description: "Campanha criada com sucesso.",
      });
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar campanha.",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const queueCampaign = async (campaignId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('campaigns-api', {
        body: {
          action: 'queue',
          campaign_id: campaignId
        }
      });

      if (error) throw error;
      
      await fetchCampaigns(); // Refresh list
      
      toast({
        title: "Sucesso",
        description: "Campanha adicionada à fila de envio.",
      });
      
      return { data, error: null };
    } catch (error) {
      console.error('Error queueing campaign:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar campanha.",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('campaigns-api', {
        body: {
          action: 'delete',
          campaign_id: campaignId
        }
      });

      if (error) throw error;
      
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      
      toast({
        title: "Sucesso",
        description: "Campanha removida com sucesso.",
      });
      
      return { data, error: null };
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover campanha.",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user]);

  return {
    campaigns,
    loading,
    createCampaign,
    queueCampaign,
    deleteCampaign,
    refetch: fetchCampaigns
  };
};