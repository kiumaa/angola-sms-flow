import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";
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
        <div className="glass-card p-8 bg-gradient-hero relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="flex items-center justify-between relative">
            <div className="space-y-4">
              <h1 className="text-5xl font-light gradient-text tracking-tight">Créditos SMS</h1>
              <p className="text-muted-foreground text-xl max-w-lg">
                Gerencie seus créditos e compre novos pacotes de SMS com total transparência
              </p>
            </div>
            <CreditBalance credits={credits} loading={creditsLoading} />
          </div>
        </div>

        {/* Credit Packages */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-light gradient-text tracking-tight">Escolha seu Pacote</h2>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto leading-relaxed">
              Sem mensalidade. Pague apenas pelos SMS que usar. Preços transparentes em Kwanzas.
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {packages.map((pkg, index) => (
              <PricingCard
                key={pkg.id}
                pkg={pkg}
                index={index}
                onPurchase={handlePurchase}
                isPopular={index === 1}
              />
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <Card className="glass-card rounded-3xl">
          <CardHeader className="pb-8">
            <CardTitle className="flex items-center gap-3 gradient-text text-2xl">
              <History className="h-6 w-6" />
              Histórico de Transações
            </CardTitle>
            <CardDescription className="text-lg">
              Suas últimas movimentações de créditos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-20">
                <div className="p-8 rounded-full bg-gradient-primary/10 w-fit mx-auto mb-6 shadow-glow">
                  <History className="h-16 w-16 text-primary mx-auto" />
                </div>
                <h3 className="text-2xl font-light mb-4 gradient-text">Nenhuma transação ainda</h3>
                <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                  Suas compras e movimentações de créditos aparecerão aqui assim que forem realizadas.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {transactions.map((transaction) => (
                  <TransactionCard key={transaction.id} transaction={transaction} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Credits;