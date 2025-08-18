import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface CampaignProgress {
  id: string;
  name: string;
  status: string;
  total_targets: number;
  progress: {
    queued: number;
    sending: number;
    sent: number;
    delivered: number;
    failed: number;
    undeliverable: number;
  };
  stats: {
    delivery_rate: number;
    credits_spent: number;
    estimated_cost: number;
  };
  timeline: {
    created_at: string;
    started_at?: string;
    completed_at?: string;
  };
}

export interface CampaignMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  completedToday: number;
  totalMessagesSent: number;
  averageDeliveryRate: number;
  totalCreditsSpent: number;
  recentActivity: Array<{
    campaign_name: string;
    status: string;
    timestamp: string;
    targets_processed: number;
  }>;
}

export const useCampaignMonitoring = (refreshInterval: number = 10000) => {
  const [campaigns, setCampaigns] = useState<CampaignProgress[]>([]);
  const [metrics, setMetrics] = useState<CampaignMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchCampaignProgress = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch campaigns with progress data
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select(`
          id,
          name,
          status,
          total_targets,
          created_at,
          updated_at,
          campaign_stats (
            queued,
            sending,
            sent,
            delivered,
            failed,
            undeliverable,
            credits_spent
          )
        `)
        .in('status', ['queued', 'sending', 'completed'])
        .order('updated_at', { ascending: false })
        .limit(20);

      if (campaignsError) throw campaignsError;

      const progressData: CampaignProgress[] = (campaignsData || []).map(campaign => {
        const stats = campaign.campaign_stats?.[0] || {
          queued: 0, sending: 0, sent: 0, delivered: 0, failed: 0, undeliverable: 0, credits_spent: 0
        };

        const totalProcessed = stats.sent + stats.delivered + stats.failed + stats.undeliverable;
        const deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0;

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          total_targets: campaign.total_targets || 0,
          progress: stats,
          stats: {
            delivery_rate: deliveryRate,
            credits_spent: stats.credits_spent,
            estimated_cost: campaign.total_targets || 0
          },
          timeline: {
            created_at: campaign.created_at,
            started_at: campaign.status !== 'draft' ? campaign.updated_at : undefined,
            completed_at: campaign.status === 'completed' ? campaign.updated_at : undefined
          }
        };
      });

      setCampaigns(progressData);

    } catch (error) {
      console.error('Error fetching campaign progress:', error);
      if (realTimeEnabled) {
        toast({
          title: "Erro de Conexão",
          description: "Erro ao buscar progresso das campanhas.",
          variant: "destructive"
        });
      }
    }
  }, [user, realTimeEnabled, toast]);

  const fetchMetrics = useCallback(async () => {
    if (!user) return;

    try {
      // Manual calculation for metrics
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fallback to manual calculation
      const { data: allCampaigns } = await supabase
        .from('campaigns')
        .select('status, created_at, campaign_stats(*)');

      const { data: recentActivity } = await supabase
        .from('campaigns')
        .select('name, status, updated_at, total_targets')
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('updated_at', { ascending: false })
        .limit(10);

      const totalCampaigns = allCampaigns?.length || 0;
      const activeCampaigns = allCampaigns?.filter(c => ['queued', 'sending'].includes(c.status)).length || 0;
      const completedToday = allCampaigns?.filter(c => 
        c.status === 'completed' && 
        new Date(c.created_at) >= today
      ).length || 0;

      // Calculate total messages sent and delivery rates from stats
      let totalMessagesSent = 0;
      let totalDelivered = 0;
      let totalCreditsSpent = 0;

      allCampaigns?.forEach(campaign => {
        const stats = campaign.campaign_stats?.[0];
        if (stats) {
          totalMessagesSent += stats.sent || 0;
          totalDelivered += stats.delivered || 0;
          totalCreditsSpent += stats.credits_spent || 0;
        }
      });

      const averageDeliveryRate = totalMessagesSent > 0 ? (totalDelivered / totalMessagesSent) * 100 : 0;

      setMetrics({
        totalCampaigns,
        activeCampaigns,
        completedToday,
        totalMessagesSent,
        averageDeliveryRate,
        totalCreditsSpent,
        recentActivity: (recentActivity || []).map(activity => ({
          campaign_name: activity.name,
          status: activity.status,
          timestamp: activity.updated_at,
          targets_processed: activity.total_targets || 0
        }))
      });

    } catch (error) {
      console.error('Error fetching campaign metrics:', error);
    }
  }, [user]);

  const pauseCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'paused' })
        .eq('id', campaignId)
        .eq('status', 'sending'); // Only pause if currently sending

      if (error) throw error;

      await fetchCampaignProgress();
      
      toast({
        title: "Campanha Pausada",
        description: "A campanha foi pausada com sucesso.",
      });

    } catch (error) {
      console.error('Error pausing campaign:', error);
      toast({
        title: "Erro",
        description: "Erro ao pausar campanha.",
        variant: "destructive"
      });
    }
  };

  const resumeCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'sending' })
        .eq('id', campaignId)
        .eq('status', 'paused'); // Only resume if currently paused

      if (error) throw error;

      await fetchCampaignProgress();
      
      toast({
        title: "Campanha Retomada",
        description: "A campanha foi retomada com sucesso.",
      });

    } catch (error) {
      console.error('Error resuming campaign:', error);
      toast({
        title: "Erro",
        description: "Erro ao retomar campanha.",
        variant: "destructive"
      });
    }
  };

  const cancelCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: 'canceled' })
        .eq('id', campaignId)
        .in('status', ['queued', 'sending', 'paused']);

      if (error) throw error;

      // Also cancel pending targets
      await supabase
        .from('campaign_targets')
        .update({ status: 'canceled' })
        .eq('campaign_id', campaignId)
        .eq('status', 'queued');

      await fetchCampaignProgress();
      
      toast({
        title: "Campanha Cancelada",
        description: "A campanha foi cancelada com sucesso.",
      });

    } catch (error) {
      console.error('Error canceling campaign:', error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar campanha.",
        variant: "destructive"
      });
    }
  };

  // Real-time updates using Supabase subscriptions
  useEffect(() => {
    if (!user || !realTimeEnabled) return;

    const channel = supabase
      .channel('campaign-monitoring')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns'
        },
        () => {
          fetchCampaignProgress();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_stats'
        },
        () => {
          fetchCampaignProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, realTimeEnabled, fetchCampaignProgress]);

  // Polling fallback
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    
    const fetchData = async () => {
      await Promise.all([
        fetchCampaignProgress(),
        fetchMetrics()
      ]);
      setLoading(false);
    };

    fetchData();

    if (!realTimeEnabled && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [user, fetchCampaignProgress, fetchMetrics, realTimeEnabled, refreshInterval]);

  return {
    campaigns,
    metrics,
    loading,
    realTimeEnabled,
    setRealTimeEnabled,
    pauseCampaign,
    resumeCampaign,
    cancelCampaign,
    refetch: fetchCampaignProgress
  };
};