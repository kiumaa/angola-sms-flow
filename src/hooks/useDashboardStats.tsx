import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserCredits } from "./useUserCredits";

interface DashboardStats {
  totalCampaigns: number;
  totalContacts: number;
  deliveryRate: number;
  totalSent: number;
  recentActivity: any[];
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    totalContacts: 0,
    deliveryRate: 0,
    totalSent: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { credits } = useUserCredits();

  const fetchDashboardStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get current account profile ID for queries
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) throw profileError;
      
      const accountId = profileData.id;
      
      // Fetch campaigns count
      const { count: campaignsCount, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId);
      
      if (campaignsError) throw campaignsError;
      
      // Fetch contacts count
      const { count: contactsCount, error: contactsError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .eq('is_blocked', false);
      
      if (contactsError) throw contactsError;
      
      // Fetch campaign stats for delivery rate and total sent
      const { data: campaignStatsData, error: statsError } = await supabase
        .from('campaigns')
        .select(`
          campaign_stats (
            sent,
            delivered,
            failed
          )
        `)
        .eq('account_id', accountId);
      
      if (statsError) throw statsError;
      
      // Calculate aggregated stats
      let totalSent = 0;
      let totalDelivered = 0;
      
      campaignStatsData?.forEach(campaign => {
        const stats = campaign.campaign_stats as any;
        if (stats) {
          totalSent += stats.sent || 0;
          totalDelivered += stats.delivered || 0;
        }
      });
      
      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
      
      // Fetch recent activity (last 10 campaigns)
      const { data: recentCampaigns, error: recentError } = await supabase
        .from('campaigns')
        .select(`
          name,
          status,
          created_at,
          campaign_stats (
            sent,
            delivered
          )
        `)
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (recentError) throw recentError;
      
      setStats({
        totalCampaigns: campaignsCount || 0,
        totalContacts: contactsCount || 0,
        deliveryRate: Math.round(deliveryRate * 10) / 10, // Round to 1 decimal
        totalSent,
        recentActivity: recentCampaigns || []
      });
      
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set default values on error
      setStats({
        totalCampaigns: 0,
        totalContacts: 0,
        deliveryRate: 0,
        totalSent: 0,
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  return {
    stats: {
      ...stats,
      credits // Include credits from useUserCredits
    },
    loading,
    refetch: fetchDashboardStats
  };
};