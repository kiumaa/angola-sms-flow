import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, CreditCard, Zap, TrendingUp, RefreshCw, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
      <DashboardLayout>
        <div className="space-y-8 animate-pulse">
          <div className="h-48 bg-muted/20 rounded-3xl"></div>
          <div className="grid lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[420px] bg-muted/20 rounded-3xl"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Header Section with Stats */}
        <div className="glass-card p-8 bg-gradient-hero relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="relative">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-5xl font-light gradient-text tracking-tight">Créditos SMS</h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    className="text-primary hover:bg-primary/10"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-muted-foreground text-xl max-w-lg">
                  Gerencie seus créditos e compre novos pacotes de SMS com total transparência
                </p>
                <div className="flex flex-wrap gap-4">
                  <Badge variant="secondary" className="px-4 py-2 text-sm">
                    <Zap className="h-4 w-4 mr-2" />
                    Sem mensalidade
                  </Badge>
                  <Badge variant="secondary" className="px-4 py-2 text-sm">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Preços transparentes
                  </Badge>
                </div>
              </div>
              <CreditBalance credits={credits} loading={creditsLoading} />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Transações</p>
                  <p className="text-2xl font-bold">{transactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Gasto</p>
                  <p className="text-2xl font-bold">
                    {transactions
                      .filter(t => t.status === 'completed')
                      .reduce((sum, t) => sum + t.amount_kwanza, 0)
                      .toLocaleString()} Kz
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Zap className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Créditos Comprados</p>
                  <p className="text-2xl font-bold">
                    {transactions
                      .filter(t => t.status === 'completed')
                      .reduce((sum, t) => sum + t.credits_purchased, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credit Packages */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-light gradient-text tracking-tight">Escolha seu Pacote</h2>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
              Pacotes atualizados com os melhores preços. Ideal para todos os tipos de uso.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {packages.map((pkg, index) => (
              <PricingCard
                key={pkg.id}
                pkg={pkg}
                index={index}
                onPurchase={handlePurchase}
              />
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

        {/* Transaction History */}
        <Card className="glass-card rounded-3xl">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3 gradient-text text-2xl">
                  <History className="h-6 w-6" />
                  Histórico de Transações
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  Suas últimas {transactions.length > 0 ? transactions.length : ''} movimentações de créditos
                </CardDescription>
              </div>
              {transactions.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/transactions')}
                  className="hidden sm:flex"
                >
                  Ver Todos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-8 rounded-full bg-gradient-primary/10 w-fit mx-auto mb-6 shadow-glow">
                  <History className="h-16 w-16 text-primary mx-auto" />
                </div>
                <h3 className="text-2xl font-light mb-4 gradient-text">Nenhuma transação ainda</h3>
                <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                  Suas compras e movimentações de créditos aparecerão aqui assim que forem realizadas.
                </p>
                <Button 
                  onClick={() => {
                    const firstPackage = packages[0];
                    if (firstPackage) handlePurchase(firstPackage.id);
                  }}
                  disabled={packages.length === 0}
                  className="bg-gradient-primary hover:shadow-glow"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Comprar Primeiro Pacote
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))}
                {transactions.length > 5 && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/transactions')}
                      className="w-full sm:w-auto"
                    >
                      Ver Todas as Transações ({transactions.length})
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Credits;