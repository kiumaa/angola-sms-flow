import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BusinessMetrics {
  revenue: {
    total: number;
    monthly: number;
    weekly: number;
  };
  users: {
    total: number;
    active: number;
    new_this_month: number;
  };
  sms: {
    total_sent: number;
    success_rate: number;
    avg_cost_per_sms: number;
  };
  conversion: {
    signup_to_purchase: number;
    trial_to_paid: number;
  };
}

interface AnalyticsData {
  period: 'daily' | 'weekly' | 'monthly';
  metrics: BusinessMetrics;
  trends: {
    revenue_growth: number;
    user_growth: number;
    sms_growth: number;
  };
}

export function useBusinessAnalytics(period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range based on period
      const now = new Date();
      const startDate = new Date(now);
      
      if (period === 'daily') {
        startDate.setDate(now.getDate() - 30);
      } else if (period === 'weekly') {
        startDate.setDate(now.getDate() - 90);
      } else {
        startDate.setMonth(now.getMonth() - 12);
      }

      // Fetch revenue data
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount_kwanza, created_at, status')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed');

      // Fetch user data
      const { data: users } = await supabase
        .from('profiles')
        .select('created_at, user_status, credits');

      // Fetch SMS data
      const { data: smsLogs } = await supabase
        .from('sms_logs')
        .select('status, cost_credits, created_at')
        .gte('created_at', startDate.toISOString());

      // Calculate metrics
      const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount_kwanza), 0) || 0;
      const totalSMS = smsLogs?.length || 0;
      const successfulSMS = smsLogs?.filter(s => s.status === 'delivered').length || 0;
      const totalCost = smsLogs?.reduce((sum, s) => sum + (s.cost_credits || 0), 0) || 0;

      const activeUsers = users?.filter(u => u.user_status === 'active').length || 0;
      const newUsersThisMonth = users?.filter(u => {
        const created = new Date(u.created_at);
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length || 0;

      const metrics: BusinessMetrics = {
        revenue: {
          total: totalRevenue,
          monthly: totalRevenue / 12,
          weekly: totalRevenue / 52,
        },
        users: {
          total: users?.length || 0,
          active: activeUsers,
          new_this_month: newUsersThisMonth,
        },
        sms: {
          total_sent: totalSMS,
          success_rate: totalSMS > 0 ? (successfulSMS / totalSMS) * 100 : 0,
          avg_cost_per_sms: totalSMS > 0 ? totalCost / totalSMS : 0,
        },
        conversion: {
          signup_to_purchase: 0, // Calculated from user journey
          trial_to_paid: 0,
        },
      };

      setAnalytics({
        period,
        metrics,
        trends: {
          revenue_growth: 0,
          user_growth: 0,
          sms_growth: 0,
        },
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  return {
    analytics,
    loading,
    refetch: fetchAnalytics,
  };
}
