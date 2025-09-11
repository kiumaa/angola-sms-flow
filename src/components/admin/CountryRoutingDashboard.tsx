import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Globe, Route, AlertTriangle, CheckCircle } from 'lucide-react';

interface CountryRouting {
  countryCode: string;
  countryName: string;
  primaryGateway: string;
  fallbackGateway: string;
  totalMessages: number;
  successRate: number;
  lastUsed: string;
  fallbackRate: number;
}

const COUNTRY_NAMES: Record<string, string> = {
  'AO': 'Angola',
  'PT': 'Portugal', 
  'MZ': 'Moçambique',
  'CV': 'Cabo Verde',
  'GW': 'Guiné-Bissau',
  'ST': 'São Tomé e Príncipe',
  'TL': 'Timor-Leste',
  'UNKNOWN': 'Outros Países'
};

export default function CountryRoutingDashboard() {
  const [routingData, setRoutingData] = useState<CountryRouting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutingData();
    const interval = setInterval(loadRoutingData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadRoutingData = async () => {
    try {
      const { data: logs } = await supabase
        .from('sms_logs')
        .select('country_code, gateway_used, gateway_priority, status, created_at, fallback_attempted')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (logs) {
        const countryStats = new Map<string, CountryRouting>();

        logs.forEach(log => {
          const countryCode = log.country_code || 'UNKNOWN';
          if (!countryStats.has(countryCode)) {
            // Determine routing based on country
            const primaryGateway = ['AO', 'MZ', 'CV', 'GW', 'ST', 'TL'].includes(countryCode) ? 'bulkgate' : 'bulksms';
            const fallbackGateway = primaryGateway === 'bulkgate' ? 'bulksms' : 'bulkgate';

            countryStats.set(countryCode, {
              countryCode,
              countryName: COUNTRY_NAMES[countryCode] || countryCode,
              primaryGateway,
              fallbackGateway,
              totalMessages: 0,
              successRate: 0,
              lastUsed: log.created_at,
              fallbackRate: 0
            });
          }

          const stats = countryStats.get(countryCode)!;
          stats.totalMessages++;
          
          if (new Date(log.created_at) > new Date(stats.lastUsed)) {
            stats.lastUsed = log.created_at;
          }
        });

        // Calculate success and fallback rates
        countryStats.forEach((stats, countryCode) => {
          const countryLogs = logs.filter(log => (log.country_code || 'UNKNOWN') === countryCode);
          const successful = countryLogs.filter(log => log.status === 'sent' || log.status === 'delivered').length;
          const fallbackUsed = countryLogs.filter(log => log.fallback_attempted).length;
          
          stats.successRate = countryLogs.length > 0 ? (successful / countryLogs.length) * 100 : 0;
          stats.fallbackRate = countryLogs.length > 0 ? (fallbackUsed / countryLogs.length) * 100 : 0;
        });

        setRoutingData(Array.from(countryStats.values()).sort((a, b) => b.totalMessages - a.totalMessages));
      }
    } catch (error) {
      console.error('Error loading routing data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Roteamento por País
          </CardTitle>
          <CardDescription>
            Configuração automática de gateway baseada no país de destino (últimos 7 dias)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {routingData.length > 0 ? (
            <div className="space-y-4">
              {routingData.map((country) => (
                <div key={country.countryCode} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{country.countryName}</h3>
                      <Badge variant="outline">{country.countryCode}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={country.successRate >= 95 ? 'default' : country.successRate >= 80 ? 'secondary' : 'destructive'}>
                        {country.successRate.toFixed(1)}% sucesso
                      </Badge>
                      {country.fallbackRate > 20 && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {country.fallbackRate.toFixed(1)}% fallback
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Gateway Primário</p>
                      <p className="font-semibold flex items-center gap-1">
                        {country.primaryGateway.toUpperCase()}
                        {country.primaryGateway === 'bulkgate' && country.countryCode === 'AO' && (
                          <span className="text-green-600 text-xs">(SMSAO)</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fallback</p>
                      <p className="font-semibold">{country.fallbackGateway.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Mensagens</p>
                      <p className="font-semibold">{country.totalMessages}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Último Uso</p>
                      <p className="font-semibold">{new Date(country.lastUsed).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  {country.countryCode === 'AO' && (
                    <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Configuração para Angola: BulkGate com Sender ID "SMSAO" aprovado
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Route className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">Nenhum dados de roteamento</h3>
              <p className="text-muted-foreground">Envie algumas mensagens para ver as estatísticas de roteamento por país.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}