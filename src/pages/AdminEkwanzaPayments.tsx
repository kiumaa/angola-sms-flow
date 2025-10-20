import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, QrCode, Search, Filter, RefreshCw, Download, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EkwanzaPaymentDetailsModal } from "@/components/admin/EkwanzaPaymentDetailsModal";
import { EkwanzaStatsCards } from "@/components/admin/EkwanzaStatsCards";
import { EkwanzaIPDiscovery } from "@/components/admin/EkwanzaIPDiscovery";

interface EkwanzaPayment {
  id: string;
  user_id: string;
  transaction_id: string;
  payment_method: string;
  amount: number;
  status: string;
  reference_code: string;
  ekwanza_code: string | null;
  ekwanza_operation_code: string | null;
  mobile_number: string | null;
  qr_code_base64: string | null;
  reference_number: string | null;
  expiration_date: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  raw_response: any;
  raw_callback: any;
  callback_received_at: string | null;
  transactions: {
    id: string;
    credits_purchased: number;
    credit_packages: {
      name: string;
    } | null;
  };
  profiles: {
    full_name: string;
    email: string;
    company_name: string;
  } | null;
}

const AdminEkwanzaPayments = () => {
  const [payments, setPayments] = useState<EkwanzaPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<EkwanzaPayment | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  // Auto-refresh every 30 seconds for pending payments
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchPayments(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchPayments = async (silent = false) => {
    if (!silent) setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('ekwanza_payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Fetch related data for each payment
      const paymentsWithDetails = await Promise.all(
        (data || []).map(async (payment) => {
          const { data: transaction } = await supabase
            .from('transactions')
            .select(`
              id,
              credits_purchased,
              credit_packages (name)
            `)
            .eq('id', payment.transaction_id)
            .single();

          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, company_name')
            .eq('user_id', payment.user_id)
            .single();

          return {
            ...payment,
            transactions: transaction || { id: '', credits_purchased: 0, credit_packages: null },
            profiles: profile || { full_name: '', email: '', company_name: '' }
          };
        })
      );

      setPayments(paymentsWithDetails);
    } catch (error) {
      console.error('Error fetching É-kwanza payments:', error);
      if (!silent) {
        toast({
          title: "Erro",
          description: "Erro ao carregar pagamentos É-kwanza.",
          variant: "destructive"
        });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const checkPaymentStatus = async (payment: EkwanzaPayment) => {
    try {
      const { data, error } = await supabase.functions.invoke('ekwanza-check-status', {
        body: { payment_id: payment.id }
      });

      if (error) throw error;

      toast({
        title: data.status === 'paid' ? "Pagamento confirmado!" : "Status atualizado",
        description: data.status === 'paid' 
          ? `Créditos adicionados à conta do usuário.`
          : `Status: ${data.status}`,
      });

      fetchPayments();
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao verificar status do pagamento.",
        variant: "destructive"
      });
    }
  };

  const cancelPayment = async (payment: EkwanzaPayment) => {
    try {
      const { error: paymentError } = await supabase
        .from('ekwanza_payments')
        .update({ status: 'cancelled' })
        .eq('id', payment.id);

      if (paymentError) throw paymentError;

      const { error: transactionError } = await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', payment.transaction_id);

      if (transactionError) throw transactionError;

      toast({
        title: "Pagamento cancelado",
        description: "O pagamento foi cancelado com sucesso.",
      });

      fetchPayments();
    } catch (error) {
      console.error('Error cancelling payment:', error);
      toast({
        title: "Erro",
        description: "Erro ao cancelar pagamento.",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = () => {
    const csv = filteredPayments.map(p => ({
      'ID': p.id,
      'Usuário': p.profiles?.email,
      'Método': getMethodLabel(p.payment_method),
      'Valor (Kz)': p.amount,
      'Créditos': p.transactions.credits_purchased,
      'Status': getStatusLabel(p.status),
      'Código É-kwanza': p.ekwanza_code || 'N/A',
      'Referência': p.reference_code,
      'Criado em': new Date(p.created_at).toLocaleString('pt-AO'),
      'Expira em': p.expiration_date ? new Date(p.expiration_date).toLocaleString('pt-AO') : 'N/A',
      'Pago em': p.paid_at ? new Date(p.paid_at).toLocaleString('pt-AO') : 'N/A'
    }));

    const headers = Object.keys(csv[0]).join(',');
    const rows = csv.map(row => Object.values(row).join(','));
    const csvContent = [headers, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ekwanza-payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getMethodLabel = (method: string) => {
    const labels = {
      qrcode: 'QR Code',
      mcx: 'Multicaixa Express',
      referencia: 'Referência EMIS'
    };
    return labels[method as keyof typeof labels] || method;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendente',
      paid: 'Pago',
      expired: 'Expirado',
      cancelled: 'Cancelado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      paid: 'default',
      expired: 'outline',
      cancelled: 'destructive'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {getStatusLabel(status)}
      </Badge>
    );
  };

  const getMethodIcon = (method: string) => {
    return <QrCode className="h-4 w-4" />;
  };

  const getTimeLeft = (expirationDate: string | null) => {
    if (!expirationDate) return null;
    
    const now = new Date();
    const expiry = new Date(expirationDate);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return { expired: true, display: 'Expirado' };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      expired: false,
      hours,
      minutes,
      display: `${hours}h ${minutes}m`,
      isUrgent: hours < 1,
      isWarning: hours < 6
    };
  };

  const filteredPayments = payments.filter(payment => {
    const matchesFilter = filter === "all" || payment.status === filter;
    const matchesSearch = !searchTerm || 
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.ekwanza_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const stats = {
    pending: payments.filter(p => p.status === 'pending').length,
    paid: payments.filter(p => p.status === 'paid').length,
    expired: payments.filter(p => p.status === 'expired').length,
    cancelled: payments.filter(p => p.status === 'cancelled').length,
    total: payments.length,
    totalAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    qrcode: payments.filter(p => p.payment_method === 'qrcode').length,
    mcx: payments.filter(p => p.payment_method === 'mcx').length,
    referencia: payments.filter(p => p.payment_method === 'referencia').length
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Pagamentos É-kwanza</h1>
          <p className="text-muted-foreground mt-2">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Wallet className="h-8 w-8" />
            <span>Pagamentos É-kwanza</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitore pagamentos automáticos via É-kwanza
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPayments()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={filteredPayments.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Auto-refresh toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Atualização automática a cada 30 segundos
              </span>
            </div>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Ativado' : 'Desativado'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros e Busca</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, usuário, código É-kwanza ou referência..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <EkwanzaStatsCards stats={stats} />

      {/* Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="setup">🚀 Configuração É-kwanza</TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({stats.pending})</TabsTrigger>
          <TabsTrigger value="paid">Pagos ({stats.paid})</TabsTrigger>
          <TabsTrigger value="expired">Expirados ({stats.expired})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelados ({stats.cancelled})</TabsTrigger>
          <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="mt-6">
          <EkwanzaIPDiscovery />
        </TabsContent>

        <TabsContent value={filter} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos</CardTitle>
              <CardDescription>
                {filteredPayments.length} pagamento(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPayments.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum pagamento encontrado</h3>
                  <p className="text-muted-foreground">
                    Não há pagamentos com o filtro selecionado.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPayments.map((payment) => {
                    const timeLeft = getTimeLeft(payment.expiration_date);
                    
                    return (
                      <div 
                        key={payment.id}
                        className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold">
                                {payment.transactions.credits_purchased} Créditos
                              </h4>
                              {getStatusBadge(payment.status)}
                              <Badge variant="outline" className="flex items-center space-x-1">
                                {getMethodIcon(payment.payment_method)}
                                <span>{getMethodLabel(payment.payment_method)}</span>
                              </Badge>
                            </div>
                            
                            <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                              <div className="space-y-1">
                                <div>
                                  <span className="font-medium">Usuário:</span>{' '}
                                  {payment.profiles?.full_name || payment.profiles?.email}
                                </div>
                                <div>
                                  <span className="font-medium">Valor:</span>{' '}
                                  {payment.amount.toLocaleString()} Kz
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div>
                                  <span className="font-medium">Código:</span>{' '}
                                  {payment.ekwanza_code || 'N/A'}
                                </div>
                                <div>
                                  <span className="font-medium">Ref:</span>{' '}
                                  {payment.reference_code}
                                </div>
                              </div>

                              <div className="space-y-1">
                                <div>
                                  <span className="font-medium">Criado:</span>{' '}
                                  {new Date(payment.created_at).toLocaleDateString('pt-AO')}
                                </div>
                                {timeLeft && (
                                  <div>
                                    <span className="font-medium">Expira:</span>{' '}
                                    <span className={
                                      timeLeft.expired ? 'text-red-600' :
                                      timeLeft.isUrgent ? 'text-red-600 font-semibold' :
                                      timeLeft.isWarning ? 'text-yellow-600' :
                                      ''
                                    }>
                                      {timeLeft.display}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              Ver Detalhes
                            </Button>
                            
                            {payment.status === 'pending' && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => checkPaymentStatus(payment)}
                                >
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Verificar
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => cancelPayment(payment)}
                                >
                                  Cancelar
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Details Modal */}
      {selectedPayment && (
        <EkwanzaPaymentDetailsModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onCheckStatus={checkPaymentStatus}
          onCancel={cancelPayment}
        />
      )}
    </div>
  );
};

export default AdminEkwanzaPayments;
