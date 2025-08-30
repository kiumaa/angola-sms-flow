import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign, 
  TrendingUp, 
  Globe, 
  Package, 
  AlertTriangle,
  Users,
  MessageSquare,
  CreditCard,
  BarChart3
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface FinancialMetrics {
  totalRevenue: number;
  totalSMSSent: number;
  totalFreeCredits: number;
  smsByCountry: Record<string, { count: number; credits: number; multiplier: number; }>;
  packageStats: Array<{
    name: string;
    credits: number;
    price: number;
    sold: number;
    revenue: number;
    pricePerCredit: number;
  }>;
  costEstimate: Record<string, { cost: number; currency: string; }>;
  profitMargin: number;
}

export default function AdminFinanceiro() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchFinancialMetrics();
  }, [timeRange]);

  const fetchFinancialMetrics = async () => {
    try {
      setLoading(true);
      
      // Data range filter
      const dateFilter = new Date();
      if (timeRange === '7d') dateFilter.setDate(dateFilter.getDate() - 7);
      else if (timeRange === '30d') dateFilter.setDate(dateFilter.getDate() - 30);
      else if (timeRange === '90d') dateFilter.setDate(dateFilter.getDate() - 90);

      // Fetch revenue (excluding free credits)
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount_kwanza, credits_purchased, created_at')
        .eq('status', 'completed')
        .gte('created_at', dateFilter.toISOString());

      // Fetch credit adjustments (separate free vs paid)
      const { data: adjustments } = await supabase
        .from('credit_adjustments')
        .select('delta, is_free_credit, created_at')
        .gte('created_at', dateFilter.toISOString());

      // Fetch SMS by country
      const { data: smsLogs } = await supabase
        .from('sms_logs')
        .select('country_code, credits_multiplier, cost_credits, created_at')
        .gte('created_at', dateFilter.toISOString());

      // Fetch package data
      const { data: packages } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true);

      // Process data
      const totalRevenue = (transactions || []).reduce((sum, t) => sum + Number(t.amount_kwanza), 0);
      const totalFreeCredits = (adjustments || [])
        .filter(a => a.is_free_credit && a.delta > 0)
        .reduce((sum, a) => sum + a.delta, 0);

      const smsByCountry: Record<string, any> = {};
      (smsLogs || []).forEach(log => {
        const country = log.country_code || '+244';
        if (!smsByCountry[country]) {
          smsByCountry[country] = { count: 0, credits: 0, multiplier: log.credits_multiplier || 1 };
        }
        smsByCountry[country].count++;
        smsByCountry[country].credits += log.cost_credits || 1;
      });

      // Package stats with transaction correlation
      const packageStats = (packages || []).map(pkg => {
        const packageTransactions = (transactions || [])
          .filter(t => t.credits_purchased === pkg.credits);
        const sold = packageTransactions.length;
        const revenue = packageTransactions.reduce((sum, t) => sum + Number(t.amount_kwanza), 0);
        
        return {
          name: pkg.name,
          credits: pkg.credits,
          price: Number(pkg.price_kwanza),
          sold,
          revenue,
          pricePerCredit: Number(pkg.price_kwanza) / pkg.credits
        };
      });

      // Cost estimates (simplified - would need real exchange rates in production)
      const costEstimate = Object.entries(smsByCountry).reduce((acc, [country, data]) => {
        // Simplified cost estimation (in production, use real gateway costs)
        const baseCostEUR = 0.03; // Base cost per SMS in EUR
        const cost = data.count * baseCostEUR * data.multiplier;
        acc[country] = { cost, currency: 'EUR' };
        return acc;
      }, {} as Record<string, any>);

      const totalCostEUR = Object.values(costEstimate).reduce((sum: number, c: any) => sum + c.cost, 0);
      const revenueEUR = totalRevenue / 850; // Approximate USD/EUR conversion (would use real rates)
      const profitMargin = totalRevenue > 0 ? ((revenueEUR - totalCostEUR) / revenueEUR) * 100 : 0;

      setMetrics({
        totalRevenue,
        totalSMSSent: Object.values(smsByCountry).reduce((sum: number, data: any) => sum + data.count, 0),
        totalFreeCredits,
        smsByCountry,
        packageStats,
        costEstimate,
        profitMargin
      });

    } catch (error) {
      console.error('Error fetching financial metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Painel Financeiro</h1>
            <p className="text-muted-foreground">
              Controle financeiro e análise de rentabilidade
            </p>
          </div>
          
          <div className="flex gap-2">
            {['7d', '30d', '90d', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1 text-sm rounded-md transition-colors",
                  timeRange === range 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {range === 'all' ? 'Tudo' : range}
              </button>
            ))}
          </div>
        </div>

        {/* Métricas principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalRevenue.toLocaleString()} Kz</div>
              <p className="text-xs text-muted-foreground">
                Excluindo créditos grátis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SMS Enviadas</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalSMSSent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Todas as mensagens enviadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Créditos Grátis</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalFreeCredits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Boas-vindas e promoções
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                (metrics?.profitMargin || 0) > 50 ? "text-green-600" : 
                (metrics?.profitMargin || 0) > 20 ? "text-yellow-600" : "text-red-600"
              )}>
                {metrics?.profitMargin.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Estimativa baseada em custos
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="countries" className="space-y-4">
          <TabsList>
            <TabsTrigger value="countries">Por País</TabsTrigger>
            <TabsTrigger value="packages">Pacotes</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value="countries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  SMS por País
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(metrics?.smsByCountry || {}).map(([country, data]: [string, any]) => {
                    const costData = metrics?.costEstimate[country];
                    const avgCostPerSMS = costData ? (costData.cost / data.count) : 0;
                    
                    return (
                      <div key={country} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{country}</div>
                          <div className="text-sm text-muted-foreground">
                            {data.count.toLocaleString()} SMS • Multiplicador: {data.multiplier}x
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-medium">{data.credits.toLocaleString()} créditos</div>
                          <div className="text-sm text-muted-foreground">
                            €{avgCostPerSMS.toFixed(4)} por SMS
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="packages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Análise de Pacotes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.packageStats.map((pkg, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{pkg.name}</h3>
                        <Badge variant="outline">{pkg.credits.toLocaleString()} créditos</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Preço</div>
                          <div className="font-medium">{pkg.price.toLocaleString()} Kz</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Vendidos</div>
                          <div className="font-medium">{pkg.sold}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Receita</div>
                          <div className="font-medium">{pkg.revenue.toLocaleString()} Kz</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Kz por crédito</div>
                          <div className="font-medium">{pkg.pricePerCredit.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <div className="space-y-4">
              {/* Alerta de margem baixa */}
              {(metrics?.profitMargin || 0) < 20 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Margem de lucro baixa:</strong> A margem atual de {metrics?.profitMargin.toFixed(1)}% 
                    está abaixo do recomendado (20%). Considere ajustar preços ou renegociar custos.
                  </AlertDescription>
                </Alert>
              )}

              {/* Alerta de países com alta variação de custo */}
              {Object.entries(metrics?.smsByCountry || {}).map(([country, data]: [string, any]) => {
                if (data.multiplier > 2) {
                  return (
                    <Alert key={country}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Custo elevado - {country}:</strong> Multiplicador de {data.multiplier}x 
                        pode impactar a rentabilidade. Monitorar demanda vs margem.
                      </AlertDescription>
                    </Alert>
                  );
                }
                return null;
              })}

              {/* Info sobre créditos grátis */}
              <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertDescription>
                  <strong>Créditos grátis:</strong> {metrics?.totalFreeCredits.toLocaleString()} créditos 
                  foram oferecidos gratuitamente. Estes não são contabilizados na receita mas 
                  representam custos operacionais.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}