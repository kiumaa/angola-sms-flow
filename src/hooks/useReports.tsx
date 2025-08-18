import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface CampaignReport {
  id: string;
  name: string;
  status: string;
  created_at: string;
  schedule_at: string | null;
  stats: {
    queued: number;
    sending: number;
    sent: number;
    delivered: number;
    failed: number;
    undeliverable: number;
    credits_spent: number;
  };
  delivery_rate: number;
}

export interface ReportsMetrics {
  totalCampaigns: number;
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalCreditsSpent: number;
  averageDeliveryRate: number;
  campaignsByStatus: Record<string, number>;
  dailyStats: Array<{
    date: string;
    sent: number;
    delivered: number;
    failed: number;
  }>;
}

export const useReports = () => {
  const [campaigns, setCampaigns] = useState<CampaignReport[]>([]);
  const [metrics, setMetrics] = useState<ReportsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchReports = async (dateFrom?: string, dateTo?: string) => {
    if (!user) return;

    try {
      setLoading(true);

      // Build query with date filters
      let campaignsQuery = supabase
        .from('campaigns')
        .select(`
          id,
          name,
          status,
          created_at,
          schedule_at,
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
        .order('created_at', { ascending: false });

      if (dateFrom) {
        campaignsQuery = campaignsQuery.gte('created_at', dateFrom);
      }
      if (dateTo) {
        campaignsQuery = campaignsQuery.lte('created_at', dateTo);
      }

      const { data: campaignsData, error: campaignsError } = await campaignsQuery;

      if (campaignsError) throw campaignsError;

      // Transform data and calculate metrics
      const transformedCampaigns: CampaignReport[] = (campaignsData || []).map(campaign => {
        const stats = campaign.campaign_stats?.[0] || {
          queued: 0,
          sending: 0,
          sent: 0,
          delivered: 0,
          failed: 0,
          undeliverable: 0,
          credits_spent: 0
        };

        const deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0;

        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          created_at: campaign.created_at,
          schedule_at: campaign.schedule_at,
          stats,
          delivery_rate: Math.round(deliveryRate * 100) / 100
        };
      });

      setCampaigns(transformedCampaigns);

      // Calculate overall metrics
      const totalSent = transformedCampaigns.reduce((sum, c) => sum + c.stats.sent, 0);
      const totalDelivered = transformedCampaigns.reduce((sum, c) => sum + c.stats.delivered, 0);
      const totalFailed = transformedCampaigns.reduce((sum, c) => sum + c.stats.failed, 0);
      const totalCreditsSpent = transformedCampaigns.reduce((sum, c) => sum + c.stats.credits_spent, 0);
      const avgDeliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

      // Count campaigns by status
      const campaignsByStatus = transformedCampaigns.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get daily stats for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: dailyStatsData } = await supabase
        .from('campaigns')
        .select(`
          created_at,
          campaign_stats (
            sent,
            delivered,
            failed
          )
        `)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const dailyStatsMap = new Map<string, { sent: number; delivered: number; failed: number }>();
      
      (dailyStatsData || []).forEach(campaign => {
        const date = campaign.created_at.split('T')[0];
        const stats = campaign.campaign_stats?.[0];
        if (stats) {
          const existing = dailyStatsMap.get(date) || { sent: 0, delivered: 0, failed: 0 };
          dailyStatsMap.set(date, {
            sent: existing.sent + (stats.sent || 0),
            delivered: existing.delivered + (stats.delivered || 0),
            failed: existing.failed + (stats.failed || 0)
          });
        }
      });

      const dailyStats = Array.from(dailyStatsMap.entries())
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setMetrics({
        totalCampaigns: transformedCampaigns.length,
        totalSent,
        totalDelivered,
        totalFailed,
        totalCreditsSpent,
        averageDeliveryRate: Math.round(avgDeliveryRate * 100) / 100,
        campaignsByStatus,
        dailyStats
      });

    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatórios.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = (campaigns: CampaignReport[]) => {
    const headers = [
      'Nome da Campanha',
      'Status',
      'Data de Criação',
      'Agendado Para',
      'Enviados',
      'Entregues',
      'Falharam',
      'Taxa de Entrega (%)',
      'Créditos Gastos'
    ];

    const rows = campaigns.map(campaign => [
      campaign.name,
      campaign.status,
      new Date(campaign.created_at).toLocaleDateString('pt-BR'),
      campaign.schedule_at ? new Date(campaign.schedule_at).toLocaleDateString('pt-BR') : '-',
      campaign.stats.sent,
      campaign.stats.delivered,
      campaign.stats.failed,
      campaign.delivery_rate,
      campaign.stats.credits_spent
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-campanhas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  return {
    campaigns,
    metrics,
    loading,
    fetchReports,
    exportToCsv,
    refetch: fetchReports
  };
};