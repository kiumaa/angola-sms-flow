import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CreditCard, Eye, CheckCircle, XCircle, Clock, FileText, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  amount_kwanza: number;
  credits_purchased: number;
  status: string;
  payment_method: string;
  payment_reference: string;
  created_at: string;
  user_id: string;
  profiles: {
    email: string;
    full_name: string;
    company_name: string;
  } | null;
}

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name,
            company_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions((data as any) || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar transações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveTransaction = async (transaction: Transaction) => {
    setProcessing(true);
    
    try {
      // Update transaction status
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', transaction.id);

      if (transactionError) throw transactionError;

      // Add credits to user
      const { error: creditsError } = await supabase
        .rpc('add_user_credits', {
          user_id: transaction.user_id,
          credit_amount: transaction.credits_purchased
        });

      if (creditsError) throw creditsError;

      toast({
        title: "Transação aprovada!",
        description: `${transaction.credits_purchased} créditos adicionados à conta do usuário.`,
      });

      fetchTransactions();
    } catch (error) {
      console.error('Error approving transaction:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar transação.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const rejectTransaction = async (transaction: Transaction) => {
    if (!rejectReason.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o motivo da rejeição.",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'failed',
          payment_reference: `${transaction.payment_reference} | REJEITADO: ${rejectReason}`
        })
        .eq('id', transaction.id);

      if (error) throw error;

      toast({
        title: "Transação rejeitada",
        description: "Usuário será notificado sobre a rejeição.",
      });

      setRejectReason("");
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar transação.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const, icon: Clock },
      completed: { label: "Aprovada", variant: "default" as const, icon: CheckCircle },
      failed: { label: "Rejeitada", variant: "destructive" as const, icon: XCircle },
      refunded: { label: "Reembolsada", variant: "outline" as const, icon: FileText }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === "all") return true;
    return transaction.status === filter;
  });

  const stats = {
    pending: transactions.filter(t => t.status === 'pending').length,
    completed: transactions.filter(t => t.status === 'completed').length,
    failed: transactions.filter(t => t.status === 'failed').length,
    total: transactions.length
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Transações</h1>
          <p className="text-muted-foreground mt-2">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <CreditCard className="h-8 w-8" />
          <span>Gestão de Transações</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Aprove ou rejeite pagamentos de créditos SMS
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprovadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.completed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejeitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.failed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.total}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="pending">Pendentes ({stats.pending})</TabsTrigger>
          <TabsTrigger value="completed">Aprovadas</TabsTrigger>
          <TabsTrigger value="failed">Rejeitadas</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Transações</CardTitle>
              <CardDescription>
                {filteredTransactions.length} transação(ões) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma transação encontrada</h3>
                  <p className="text-muted-foreground">
                    Não há transações com o filtro selecionado.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold">
                              {transaction.credits_purchased} Créditos SMS
                            </h4>
                            {getStatusBadge(transaction.status)}
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4" />
                                <span>{transaction.profiles?.full_name || transaction.profiles?.email}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {new Date(transaction.created_at).toLocaleDateString('pt-AO', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div>
                                <span className="font-medium">Valor:</span> {Number(transaction.amount_kwanza).toLocaleString()} Kz
                              </div>
                              <div>
                                <span className="font-medium">Empresa:</span> {transaction.profiles?.company_name || 'N/A'}
                              </div>
                              {transaction.payment_reference && (
                                <div>
                                  <span className="font-medium">Ref:</span> {transaction.payment_reference}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                Ver Detalhes
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Detalhes da Transação</DialogTitle>
                                <DialogDescription>
                                  Informações completas da transação
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label>Cliente</Label>
                                  <p className="font-medium">{transaction.profiles?.full_name || transaction.profiles?.email}</p>
                                  <p className="text-sm text-muted-foreground">{transaction.profiles?.email}</p>
                                </div>
                                <div>
                                  <Label>Valor</Label>
                                  <p className="font-medium">{Number(transaction.amount_kwanza).toLocaleString()} Kz</p>
                                </div>
                                <div>
                                  <Label>Créditos</Label>
                                  <p className="font-medium">{transaction.credits_purchased} SMS</p>
                                </div>
                                <div>
                                  <Label>Referência/Observações</Label>
                                  <p className="text-sm">{transaction.payment_reference || 'Nenhuma'}</p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {transaction.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => approveTransaction(transaction)}
                                disabled={processing}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => setSelectedTransaction(transaction)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Rejeitar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Rejeitar Transação</DialogTitle>
                                    <DialogDescription>
                                      Informe o motivo da rejeição. O usuário será notificado.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="reason">Motivo da Rejeição</Label>
                                      <Textarea
                                        id="reason"
                                        placeholder="Ex: Comprovante ilegível, valor incorreto..."
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                      />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <Button 
                                        variant="outline" 
                                        onClick={() => {
                                          setRejectReason("");
                                          setSelectedTransaction(null);
                                        }}
                                      >
                                        Cancelar
                                      </Button>
                                      <Button 
                                        variant="destructive"
                                        onClick={() => selectedTransaction && rejectTransaction(selectedTransaction)}
                                        disabled={processing}
                                      >
                                        {processing ? "Processando..." : "Confirmar Rejeição"}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTransactions;