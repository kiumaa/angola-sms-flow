import { format } from "date-fns";

interface ChartDataPoint {
  date: string;
  sent: number;
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

interface ExportData {
  volumeByDay: ChartDataPoint[];
  deliveryRateTrend: ChartDataPoint[];
  gatewayDistribution: DistributionData[];
  countryDistribution: DistributionData[];
  hourlyActivity: HourlyData[];
  smsMetrics: {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    deliveryRate: number;
  };
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
  };
  financialMetrics: {
    revenue: number;
    totalTransactions: number;
    completedTransactions: number;
    avgTransactionValue: number;
  };
}

export const exportAnalyticsToCSV = (data: ExportData, timeRange: string) => {
  const timestamp = format(new Date(), "yyyy-MM-dd-HHmm");
  
  // Create comprehensive CSV with multiple sections
  const sections: string[] = [];

  // Header
  sections.push("# RELATÓRIO DE ANALYTICS SMS");
  sections.push(`Período: ${timeRange}`);
  sections.push(`Data de Exportação: ${format(new Date(), "dd/MM/yyyy HH:mm")}`);
  sections.push("");

  // Summary metrics
  sections.push("## RESUMO GERAL");
  sections.push("Métrica,Valor");
  sections.push(`Total SMS Enviados,${data.smsMetrics.totalSent}`);
  sections.push(`Total Entregues,${data.smsMetrics.totalDelivered}`);
  sections.push(`Total Falhados,${data.smsMetrics.totalFailed}`);
  sections.push(`Taxa de Entrega,%${data.smsMetrics.deliveryRate.toFixed(2)}`);
  sections.push(`Total Usuários,${data.userMetrics.totalUsers}`);
  sections.push(`Usuários Ativos,${data.userMetrics.activeUsers}`);
  sections.push(`Novos Usuários,${data.userMetrics.newUsers}`);
  sections.push(`Receita Total,${formatKwanza(data.financialMetrics.revenue)}`);
  sections.push(`Transações Completadas,${data.financialMetrics.completedTransactions}`);
  sections.push(`Valor Médio Transação,${formatKwanza(data.financialMetrics.avgTransactionValue)}`);
  sections.push("");

  // Volume by day
  sections.push("## VOLUME DIÁRIO");
  sections.push("Data,Enviados,Entregues,Falhados,Taxa Entrega %");
  data.volumeByDay.forEach(day => {
    const rate = day.sent > 0 ? ((day.delivered || 0) / day.sent) * 100 : 0;
    sections.push(`${day.date},${day.sent},${day.delivered || 0},${day.failed || 0},${rate.toFixed(1)}`);
  });
  sections.push("");

  // Gateway distribution
  sections.push("## DISTRIBUIÇÃO POR GATEWAY");
  sections.push("Gateway,Quantidade,Porcentagem %");
  data.gatewayDistribution.forEach(gateway => {
    sections.push(`${gateway.name},${gateway.value},${gateway.percentage.toFixed(1)}`);
  });
  sections.push("");

  // Country distribution
  sections.push("## DISTRIBUIÇÃO POR PAÍS");
  sections.push("País,Quantidade,Porcentagem %");
  data.countryDistribution.forEach(country => {
    sections.push(`${country.name},${country.value},${country.percentage.toFixed(1)}`);
  });
  sections.push("");

  // Hourly activity
  sections.push("## ATIVIDADE POR HORA");
  sections.push("Hora,Quantidade");
  data.hourlyActivity.forEach(hour => {
    sections.push(`${hour.hour},${hour.count}`);
  });

  const csv = sections.join("\n");
  
  // Create and download file
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.href = url;
  link.download = `analytics-sms-${timeRange}-${timestamp}.csv`;
  link.click();
  
  URL.revokeObjectURL(url);
};

export const formatKwanza = (value: number): string => {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("pt-AO").format(value);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const getTrendIcon = (trend: number): "up" | "down" | "neutral" => {
  if (trend > 5) return "up";
  if (trend < -5) return "down";
  return "neutral";
};

export const getTrendColor = (trend: number, inverse: boolean = false): string => {
  const isPositive = inverse ? trend < 0 : trend > 0;
  if (Math.abs(trend) < 5) return "text-muted-foreground";
  return isPositive ? "text-green-600" : "text-red-600";
};
