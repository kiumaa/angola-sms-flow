import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Webhook, Clock, CheckCircle, XCircle, RefreshCw, Search, Zap, AlertTriangle, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeliveryStats {
  lastDeliveryReceived: string | null;
  delivered24h: number;
  failed24h: number;
  pending24h: number;
  totalToday: number;
}

interface SMSLog {
  id: string;
  phone_number: string;
  status: string;
  gateway_message_id: string | null;
  error_code: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
  payload: any;
}

export default function SMSDeliveryDiagnostics() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [phoneFilter, setPhoneFilter] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<SMSLog[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    loadDiagnosticsData();
    const interval = setInterval(loadDiagnosticsData, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Filter logs by phone number
    if (phoneFilter.trim()) {
      setFilteredLogs(logs.filter(log => 
        log.phone_number.includes(phoneFilter.trim())
      ));
    } else {
      setFilteredLogs(logs);
    }
  }, [logs, phoneFilter]);

  const loadDiagnosticsData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadDeliveryStats(),
        loadRecentLogs()
      ]);
    } catch (error) {
      console.error('Error loading diagnostics data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados de diagnóstico",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadDeliveryStats = async () => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [lastDelivery, delivered, failed, pending, total] = await Promise.all([
      // Last delivery received
      supabase
        .from('sms_logs')
        .select('completed_at')
        .eq('gateway_used', 'bulksms')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single(),
      
      // Delivered in last 24h
      supabase
        .from('sms_logs')
        .select('id', { count: 'exact' })
        .eq('gateway_used', 'bulksms')
        .eq('status', 'delivered')
        .gte('completed_at', last24h.toISOString()),

      // Failed in last 24h
      supabase
        .from('sms_logs')
        .select('id', { count: 'exact' })
        .eq('gateway_used', 'bulksms')
        .eq('status', 'failed')
        .gte('created_at', last24h.toISOString()),

      // Pending in last 24h
      supabase
        .from('sms_logs')
        .select('id', { count: 'exact' })
        .eq('gateway_used', 'bulksms')
        .in('status', ['pending', 'sent'])
        .gte('created_at', last24h.toISOString()),

      // Total today
      supabase
        .from('sms_logs')
        .select('id', { count: 'exact' })
        .eq('gateway_used', 'bulksms')
        .gte('created_at', todayStart.toISOString())
    ]);

    setStats({
      lastDeliveryReceived: lastDelivery.data?.completed_at || null,
      delivered24h: delivered.count || 0,
      failed24h: failed.count || 0,
      pending24h: pending.count || 0,
      totalToday: total.count || 0
    });
  };

  const loadRecentLogs = async () => {
    const { data } = await supabase
      .from('sms_logs')
      .select('*')
      .eq('gateway_used', 'bulksms')
      .order('created_at', { ascending: false })
      .limit(100);

    setLogs(data || []);
  };

  const simulateWebhook = async () => {
    if (isSimulating) return;
    
    setIsSimulating(true);
    try {
      const { data, error } = await supabase.functions.invoke('webhooks-simulate', {
        body: {
          to: '+244912345678',
          status: 'Delivered'
        }
      });

      if (error) throw error;

      toast({
        title: "Simulação executada",
        description: `Webhook simulado para ${data.simulation.phone_number}`,
      });

      // Refresh data after simulation
      setTimeout(loadDiagnosticsData, 1000);
      
    } catch (error: any) {
      console.error('Simulation error:', error);
      toast({
        title: "Erro na simulação",
        description: error.message || "Não foi possível simular o webhook",
        variant: "destructive"
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Entregue</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>;
      case 'sent':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Enviado</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="h-6 w-6" />
            Diagnóstico de Delivery Reports
          </h2>
          <p className="text-muted-foreground">
            Monitore os relatórios de entrega recebidos via webhook do BulkSMS
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={simulateWebhook} 
            disabled={isSimulating}
            variant="outline"
            size="sm"
          >
            <Zap className="w-4 h-4 mr-2" />
            {isSimulating ? 'Simulando...' : 'Simular Webhook'}
          </Button>
          <Button 
            onClick={loadDiagnosticsData} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Último Delivery</p>
                <p className="text-lg font-bold">
                  {stats?.lastDeliveryReceived 
                    ? formatTimestamp(stats.lastDeliveryReceived).split(' ')[1]
                    : 'Nenhum'
                  }
                </p>
                {stats?.lastDeliveryReceived && (
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(stats.lastDeliveryReceived).split(' ')[0]}
                  </p>
                )}
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entregues (24h)</p>
                <p className="text-2xl font-bold text-green-600">{stats?.delivered24h || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Falharam (24h)</p>
                <p className="text-2xl font-bold text-red-600">{stats?.failed24h || 0}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hoje</p>
                <p className="text-2xl font-bold">{stats?.totalToday || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Alert */}
      {stats && (
        <Alert>
          <Webhook className="h-4 w-4" />
          <AlertDescription>
            {stats.lastDeliveryReceived ? (
              `Último delivery report recebido: ${formatTimestamp(stats.lastDeliveryReceived)}. 
               Taxa de entrega (24h): ${stats.delivered24h + stats.failed24h > 0 
                 ? ((stats.delivered24h / (stats.delivered24h + stats.failed24h)) * 100).toFixed(1)
                 : 0}%`
            ) : (
              'Nenhum delivery report recebido ainda. Verifique a configuração do webhook no BulkSMS.'
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registos Recentes (Últimos 100)</CardTitle>
          <CardDescription>
            Histórico detalhado dos delivery reports recebidos
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por número de telefone..."
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message ID</TableHead>
                  <TableHead>Código de Erro</TableHead>
                  <TableHead>Completado</TableHead>
                  <TableHead>Criado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono">
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                          {log.phone_number}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.gateway_message_id || '-'}
                      </TableCell>
                      <TableCell>
                        {log.error_code ? (
                          <Badge variant="outline" className="text-red-600">
                            {log.error_code}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{formatTimestamp(log.completed_at)}</TableCell>
                      <TableCell>{formatTimestamp(log.created_at)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {phoneFilter ? 'Nenhum registo encontrado para este filtro' : 'Nenhum registo encontrado'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}