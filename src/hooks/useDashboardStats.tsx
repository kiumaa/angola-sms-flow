import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserCredits } from "./useUserCredits";

interface DashboardStats {
  totalSent: number;
  totalContacts: number;
  deliveryRate: number;
  recentActivity: any[];
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSent: 0,
    totalContacts: 0,
    deliveryRate: 95,
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
      
      // Fetch contacts count
      const { count: contactsCount, error: contactsError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .eq('is_blocked', false);
      
      if (contactsError) throw contactsError;
      
      // Fetch SMS logs for delivery stats
      const { data: smsLogsData, error: smsError } = await supabase
        .from('sms_logs')
        .select('status')
        .eq('user_id', user.id);
      
      if (smsError) throw smsError;
      
      // Calculate delivery stats from SMS logs
      const totalSent = smsLogsData?.length || 0;
      const delivered = smsLogsData?.filter(log => log.status === 'delivered').length || 0;
      const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 95;
      
      // Fetch recent quick send jobs as activity
      const { data: recentJobs, error: recentError } = await supabase
        .from('quick_send_jobs')
        .select(`
          message,
          status,
          total_recipients,
          created_at,
          credits_spent
        `)
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (recentError) throw recentError;
      
      setStats({
        totalSent,
        totalContacts: contactsCount || 0,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        recentActivity: recentJobs || []
      });
      
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set default values on error
      setStats({
        totalSent: 0,
        totalContacts: 0,
        deliveryRate: 95,
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