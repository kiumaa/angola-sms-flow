import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, subDays, format, startOfHour } from "date-fns";

interface TimeRange {
  from: Date;
  to: Date;
}

interface SMSMetrics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  trend: number;
}

interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  trend: number;
}

interface FinancialMetrics {
  revenue: number;
  totalTransactions: number;
  completedTransactions: number;
  avgTransactionValue: number;
  trend: number;
}

interface ChartDataPoint {
  date: string;
  sent?: number;
  delivered?: number;
  failed?: number;
  rate?: number;
}

interface DistributionData {
  name: string;
  value: number;
  percentage: number;
}

interface HourlyData {
  hour: string;
  count: number;
}

export const useAdminAnalytics = (timeRange: string = "7days") => {
  const getDateRange = (): TimeRange => {
    const to = endOfDay(new Date());
    let from: Date;

    switch (timeRange) {
      case "24h":
        from = startOfDay(subDays(to, 1));
        break;
      case "7days":
        from = startOfDay(subDays(to, 7));
        break;
      case "30days":
        from = startOfDay(subDays(to, 30));
        break;
      case "90days":
        from = startOfDay(subDays(to, 90));
        break;
      default:
        from = startOfDay(subDays(to, 7));
    }

    return { from, to };
  };

  const { from, to } = getDateRange();

  const fetchAnalytics = async () => {
    // Fetch SMS logs
    const { data: smsLogs, error: smsError } = await supabase
      .from("sms_logs")
      .select("*")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .order("created_at", { ascending: true });

    if (smsError) throw smsError;

    // Fetch previous period for comparison
    const previousFrom = subDays(from, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
    const { data: previousSmsLogs } = await supabase
      .from("sms_logs")
      .select("*")
      .gte("created_at", previousFrom.toISOString())
      .lt("created_at", from.toISOString());

    // Fetch user metrics
    const { data: allUsers } = await supabase
      .from("profiles")
      .select("*");

    const { data: newUsers } = await supabase
      .from("profiles")
      .select("*")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString());

    const { data: previousNewUsers } = await supabase
      .from("profiles")
      .select("*")
      .gte("created_at", previousFrom.toISOString())
      .lt("created_at", from.toISOString());

    // Fetch financial metrics
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString());

    const { data: previousTransactions } = await supabase
      .from("transactions")
      .select("*")
      .gte("created_at", previousFrom.toISOString())
      .lt("created_at", from.toISOString());

    // Calculate SMS metrics
    const totalSent = smsLogs?.length || 0;
    const totalDelivered = smsLogs?.filter(log => log.status === "delivered").length || 0;
    const totalFailed = smsLogs?.filter(log => log.status === "failed").length || 0;
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

    const previousTotalSent = previousSmsLogs?.length || 0;
    const smsTrend = previousTotalSent > 0 
      ? ((totalSent - previousTotalSent) / previousTotalSent) * 100 
      : totalSent > 0 ? 100 : 0;

    // Calculate user metrics
    const totalUsers = allUsers?.length || 0;
    const activeUsers = allUsers?.filter(u => u.user_status === "active").length || 0;
    const newUsersCount = newUsers?.length || 0;
    const previousNewUsersCount = previousNewUsers?.length || 0;
    const userTrend = previousNewUsersCount > 0
      ? ((newUsersCount - previousNewUsersCount) / previousNewUsersCount) * 100
      : newUsersCount > 0 ? 100 : 0;

    // Calculate financial metrics
    const completedTransactions = transactions?.filter(t => t.status === "completed") || [];
    const revenue = completedTransactions.reduce((sum, t) => sum + (Number(t.amount_kwanza) || 0), 0);
    const avgTransactionValue = completedTransactions.length > 0
      ? revenue / completedTransactions.length
      : 0;

    const previousCompletedTransactions = previousTransactions?.filter(t => t.status === "completed") || [];
    const previousRevenue = previousCompletedTransactions.reduce((sum, t) => sum + (Number(t.amount_kwanza) || 0), 0);
    const revenueTrend = previousRevenue > 0
      ? ((revenue - previousRevenue) / previousRevenue) * 100
      : revenue > 0 ? 100 : 0;

    // Process chart data - Volume by day
    const volumeByDay: ChartDataPoint[] = [];
    const dayMap = new Map<string, { sent: number; delivered: number; failed: number }>();

    smsLogs?.forEach(log => {
      const date = format(new Date(log.created_at), "yyyy-MM-dd");
      const current = dayMap.get(date) || { sent: 0, delivered: 0, failed: 0 };
      current.sent++;
      if (log.status === "delivered") current.delivered++;
      if (log.status === "failed") current.failed++;
      dayMap.set(date, current);
    });

    dayMap.forEach((value, date) => {
      volumeByDay.push({
        date: format(new Date(date), "dd/MMM"),
        sent: value.sent,
        delivered: value.delivered,
        failed: value.failed,
      });
    });

    // Delivery rate trend
    const deliveryRateTrend: ChartDataPoint[] = volumeByDay.map(day => ({
      date: day.date,
      rate: day.sent > 0 ? ((day.delivered || 0) / day.sent) * 100 : 0,
    }));

    // Gateway distribution
    const gatewayMap = new Map<string, number>();
    smsLogs?.forEach(log => {
      const gateway = log.gateway_used || "Desconhecido";
      gatewayMap.set(gateway, (gatewayMap.get(gateway) || 0) + 1);
    });

    const gatewayDistribution: DistributionData[] = [];
    gatewayMap.forEach((value, name) => {
      gatewayDistribution.push({
        name: name === "bulksms" ? "BulkSMS" : name === "bulkgate" ? "BulkGate" : name,
        value,
        percentage: totalSent > 0 ? (value / totalSent) * 100 : 0,
      });
    });

    // Country distribution
    const countryMap = new Map<string, number>();
    smsLogs?.forEach(log => {
      const country = log.country_code || "Desconhecido";
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });

    const countryDistribution: DistributionData[] = [];
    countryMap.forEach((value, name) => {
      countryDistribution.push({
        name: name === "AO" ? "Angola" : name === "BR" ? "Brasil" : name === "PT" ? "Portugal" : name,
        value,
        percentage: totalSent > 0 ? (value / totalSent) * 100 : 0,
      });
    });

    // Hourly activity
    const hourMap = new Map<number, number>();
    smsLogs?.forEach(log => {
      const hour = new Date(log.created_at).getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });

    const hourlyActivity: HourlyData[] = [];
    for (let i = 0; i < 24; i++) {
      hourlyActivity.push({
        hour: `${i.toString().padStart(2, "0")}h`,
        count: hourMap.get(i) || 0,
      });
    }

    // Generate insights
    const insights: { title: string; description: string; type: "success" | "warning" | "info" }[] = [];

    if (totalSent === 0) {
      insights.push({
        title: "Sem dados de SMS ainda",
        description: "Comece enviando campanhas para ver insights detalhados aqui",
        type: "info",
      });
    } else {
      if (deliveryRate >= 95) {
        insights.push({
          title: "Excelente taxa de entrega",
          description: `Taxa de ${deliveryRate.toFixed(1)}% indica alta qualidade de envio`,
          type: "success",
        });
      } else if (deliveryRate < 80) {
        insights.push({
          title: "Taxa de entrega pode melhorar",
          description: `${deliveryRate.toFixed(1)}% está abaixo do ideal. Revise números e gateways`,
          type: "warning",
        });
      }

      const peakHour = hourlyActivity.reduce((max, hour) => hour.count > max.count ? hour : max, hourlyActivity[0]);
      if (peakHour.count > 0) {
        insights.push({
          title: "Pico de atividade",
          description: `Maior volume de envios às ${peakHour.hour}`,
          type: "info",
        });
      }

      if (countryDistribution.length > 0) {
        const topCountry = countryDistribution.reduce((max, c) => c.value > max.value ? c : max);
        insights.push({
          title: "Maior mercado",
          description: `${topCountry.percentage.toFixed(1)}% dos SMS para ${topCountry.name}`,
          type: "info",
        });
      }
    }

    return {
      smsMetrics: {
        totalSent,
        totalDelivered,
        totalFailed,
        deliveryRate,
        trend: smsTrend,
      } as SMSMetrics,
      userMetrics: {
        totalUsers,
        activeUsers,
        newUsers: newUsersCount,
        trend: userTrend,
      } as UserMetrics,
      financialMetrics: {
        revenue,
        totalTransactions: transactions?.length || 0,
        completedTransactions: completedTransactions.length,
        avgTransactionValue,
        trend: revenueTrend,
      } as FinancialMetrics,
      chartData: {
        volumeByDay,
        deliveryRateTrend,
        gatewayDistribution,
        countryDistribution,
        hourlyActivity,
      },
      insights,
      isEmpty: totalSent === 0,
    };
  };

  return useQuery({
    queryKey: ["admin-analytics", timeRange],
    queryFn: fetchAnalytics,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
