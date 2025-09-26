import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, CreditCard, Zap, TrendingUp, RefreshCw, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useToast } from "@/hooks/use-toast";
import { usePackages } from "@/hooks/usePackages";
import { useUserCredits } from "@/hooks/useUserCredits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CreditBalance } from "@/components/credits/CreditBalance";
import { PricingCard } from "@/components/credits/PricingCard";
import { TransactionCard } from "@/components/credits/TransactionCard";

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

  // Calculate statistics
  const completedTransactions = transactions.filter(t => t.status === 'completed');
  const totalSpent = completedTransactions.reduce((sum, t) => sum + t.amount_kwanza, 0);
  const totalCredits = completedTransactions.reduce((sum, t) => sum + t.credits_purchased, 0);

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


  const isLoading = packagesLoading || creditsLoading || transactionsLoading;

  const handleRefresh = async () => {
    await Promise.all([
      refetchCredits(),
      fetchTransactions()
    ]);
    toast({
      title: "Dados atualizados",
      description: "Informações de créditos e transações foram atualizadas."
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-48 bg-muted/20 rounded-3xl"></div>
        <div className="grid lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-[420px] bg-muted/20 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-4xl md:text-5xl font-light gradient-text">Créditos SMS</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-primary hover:bg-primary/10"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolha o pacote ideal para suas necessidades. Preços transparentes, sem taxas ocultas.
          </p>
          
          {/* Current Balance */}
          <CreditBalance credits={credits} loading={creditsLoading} />
        </div>

        {/* Credit Packages */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-light gradient-text">Pacotes Disponíveis</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Pacotes com preços atualizados e transparentes. Escolha o que melhor se adapta ao seu uso.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {packages.map((pkg, index) => (
              <div key={pkg.id} className="group">
                <Card className="glass-card h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-glow">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl font-medium">{pkg.name}</CardTitle>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold gradient-text">
                        {pkg.price_kwanza.toLocaleString()} Kz
                      </div>
                      <p className="text-muted-foreground">{pkg.credits.toLocaleString()} SMS</p>
                      <div className="text-sm text-muted-foreground">
                        ~{(pkg.price_kwanza / pkg.credits).toFixed(2)} Kz por SMS
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground text-center">
                        {pkg.description}
                      </p>
                      
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          {pkg.credits.toLocaleString()} SMS inclusos
                        </li>
                        <li className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          Dashboard completo
                        </li>
                        <li className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-primary" />
                          Suporte prioritário
                        </li>
                      </ul>
                      
                      <Button
                        onClick={() => handlePurchase(pkg.id)}
                        className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                        size="lg"
                      >
                        Escolher Pacote
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {packages.length === 0 && !packagesLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Nenhum pacote disponível no momento. Tente novamente mais tarde.
              </p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <div className="space-y-2">
                  <CreditCard className="h-8 w-8 text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">Total Transações</p>
                  <p className="text-2xl font-bold">{transactions.length}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <div className="space-y-2">
                  <TrendingUp className="h-8 w-8 text-green-500 mx-auto" />
                  <p className="text-sm text-muted-foreground">Total Investido</p>
                  <p className="text-2xl font-bold">{totalSpent.toLocaleString()} Kz</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <div className="space-y-2">
                  <Zap className="h-8 w-8 text-blue-500 mx-auto" />
                  <p className="text-sm text-muted-foreground">SMS Adquiridos</p>
                  <p className="text-2xl font-bold">{totalCredits.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transaction History */}
        {transactions.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <History className="h-5 w-5" />
                    Histórico Recente
                  </CardTitle>
                  <CardDescription>
                    Suas últimas movimentações de créditos
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/transactions')}
                >
                  Ver Todos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 3).map((transaction) => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {transactions.length === 0 && (
          <div className="text-center py-16">
            <div className="p-8 rounded-full bg-gradient-primary/10 w-fit mx-auto mb-6">
              <CreditCard className="h-16 w-16 text-primary mx-auto" />
            </div>
            <h3 className="text-2xl font-light mb-4 gradient-text">Comece Agora</h3>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              Escolha um pacote acima para começar a enviar SMS e acompanhar suas campanhas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Credits;