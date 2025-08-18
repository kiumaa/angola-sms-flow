import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, CreditCard, History, ShoppingCart, CheckCircle, Gift, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { usePackages } from "@/hooks/usePackages";
import { useUserCredits } from "@/hooks/useUserCredits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Transaction {
  id: string;
  amount_kwanza: number;
  credits_purchased: number;
  status: string;
  payment_method: string;
  payment_reference: string;
  created_at: string;
}

const Credits = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { packages, loading: packagesLoading } = usePackages();
  const { credits, loading: creditsLoading, refetch: refetchCredits } = useUserCredits();
  const { user } = useAuth();

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      setTransactionsLoading(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico de transações.",
        variant: "destructive"
      });
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const handlePurchase = (packageId: string) => {
    navigate(`/checkout/${packageId}`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Concluída", color: "bg-green-500/20 text-green-400 border-green-500/30" },
      pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
      failed: { label: "Falhou", color: "bg-red-500/20 text-red-400 border-red-500/30" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} border rounded-full px-3 py-1`}>
        {config.label}
      </Badge>
    );
  };

  const getTransactionIcon = () => {
    return <ShoppingCart className="h-4 w-4" />;
  };

  const isLoading = packagesLoading || creditsLoading || transactionsLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-pulse">
          <div className="h-32 bg-muted/20 rounded-3xl"></div>
          <div className="grid lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-96 bg-muted/20 rounded-3xl"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="glass-card p-8 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="flex items-center justify-between relative">
            <div>
              <h1 className="text-4xl font-light mb-2 gradient-text">Créditos SMS</h1>
              <p className="text-muted-foreground text-lg">
                Gerencie seus créditos e compre novos pacotes
              </p>
            </div>
            <Card className="glass-card border-primary bg-primary/5 text-center min-w-48">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-3 rounded-2xl bg-gradient-primary shadow-glow mr-3">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Atual</p>
                    <p className="text-3xl font-light gradient-text">{credits?.toLocaleString() || "0"}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">SMS disponíveis</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Credit Packages */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-light mb-4 gradient-text">Escolha seu Pacote</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Sem mensalidade. Pague apenas pelos SMS que usar. Preços em Kwanzas para sua conveniência.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {packages.map((pkg, index) => (
              <Card 
                key={pkg.id} 
                className={`relative transition-all duration-500 hover:scale-105 rounded-3xl overflow-hidden animate-slide-up-stagger card-futuristic border-glass-border ${
                  index === 1 ? 'border-2 border-primary shadow-glow scale-105' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {index === 1 && <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>}
                
                {index === 1 && (
                  <div className="flex justify-center mb-4">
                    <Badge className="bg-gradient-primary text-white rounded-full px-6 py-2 shadow-glow">
                      ⭐ Mais Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8 relative">
                  <CardTitle className="gradient-text font-medium text-xl">{pkg.name}</CardTitle>
                  <div className="mt-6">
                    <span className="text-4xl font-light gradient-text">{(pkg.price_kwanza / 1000).toFixed(0)}.000</span>
                    <span className="text-muted-foreground text-lg"> Kz</span>
                  </div>
                  <CardDescription className="mt-4 text-base">{pkg.description || `${pkg.credits} SMS incluídos`}</CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0 relative">
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start text-sm">
                      <CheckCircle className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span>{pkg.credits} SMS incluídos</span>
                    </li>
                    <li className="flex items-start text-sm">
                      <CheckCircle className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span>Dashboard básico</span>
                    </li>
                    <li className="flex items-start text-sm">
                      <CheckCircle className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span>Suporte por email</span>
                    </li>
                  </ul>
                  <Button 
                    onClick={() => handlePurchase(pkg.id)}
                    className="w-full rounded-3xl transition-all duration-300 hover:scale-105 text-base py-6 button-futuristic"
                    size="lg"
                  >
                    Escolher Pacote
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <Card className="card-futuristic">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 gradient-text">
              <History className="h-5 w-5" />
              Histórico de Transações
            </CardTitle>
            <CardDescription>
              Suas últimas movimentações de créditos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-6 rounded-3xl bg-gradient-primary/10 w-fit mx-auto mb-6">
                  <History className="h-12 w-12 text-primary mx-auto" />
                </div>
                <h3 className="text-xl font-normal mb-2">Nenhuma transação ainda</h3>
                <p className="text-muted-foreground mb-8">
                  Suas compras e movimentações aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-4 rounded-2xl glass-card border-glass-border hover-lift"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-gradient-primary shadow-glow">
                        <ShoppingCart className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">Pacote de {transaction.credits_purchased} SMS</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-green-500">
                            +{transaction.credits_purchased} SMS
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {(transaction.amount_kwanza / 1000).toFixed(0)}.000 Kz
                          </p>
                        </div>
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card className="card-futuristic border-blue-500/30 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-blue-400 text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Formas de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Transferência Bancária</h4>
                <p className="text-sm text-muted-foreground">
                  • BAI, BIC, BFA, Millennium<br/>
                  • Confirmação automática<br/>
                  • Processamento em até 24h
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Pagamento Digital</h4>
                <p className="text-sm text-muted-foreground">
                  • Express Payment, Multicaixa<br/>
                  • Confirmação instantânea<br/>
                  • Créditos liberados imediatamente
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-blue-500/20">
              <p className="text-sm text-blue-400">
                💡 <strong>Dica:</strong> Mantenha comprovantes de pagamento para agilizar a liberação dos créditos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Credits;