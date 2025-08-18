import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { useQueryCache } from "./useCache";

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
  const { user } = useAuth();
  const { toast } = useToast();

  // Use cache for campaigns data
  const {
    data: campaigns = [],
    loading,
    error,
    refresh: refetchCampaigns,
    invalidate
  } = useQueryCache(
    ['campaigns', user?.id],
    async () => {
      if (!user) return [];
      
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
      
      return data || [];
    },
    {
      ttl: 2 * 60 * 1000, // 2 minutes cache for campaigns
      enabled: !!user,
      refetchInterval: 30000, // Auto refresh every 30 seconds
      staleWhileRevalidate: true
    }
  );

  const createCampaign = async (campaignData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('campaigns-api', {
        body: {
          ...campaignData,
          action: 'create'
        }
      });

      if (error) throw error;
      
      // Invalidate cache and refresh
      invalidate();
      await refetchCampaigns();
      
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
      
      // Invalidate cache and refresh
      invalidate();
      await refetchCampaigns();
      
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
      
      // Update cache immediately (optimistic update)
      invalidate();
      
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

  // Handle realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('campaigns-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'campaigns',
      }, () => {
        // Invalidate cache when campaigns change
        invalidate();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'campaign_stats',
      }, () => {
        // Invalidate cache when stats change
        invalidate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, invalidate]);

  return {
    campaigns,
    loading,
    createCampaign,
    queueCampaign,
    deleteCampaign,
    refetch: refetchCampaigns
  };
};