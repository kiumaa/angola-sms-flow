import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckoutProgressSteps } from "@/components/checkout/CheckoutProgressSteps";
import { EnhancedSuccessPage } from "@/components/checkout/EnhancedSuccessPage";
import { motion } from "motion/react";

const CheckoutSuccess = () => {
  const { transactionId } = useParams();
  const { toast } = useToast();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  const bankDetails = {
    bank: "BFA | Banco de Fomento Angola, S.A.",
    account: "123456789",
    iban: "0006 0000 3442 5465 3012.5",
    holder: "KB AGENCY- PRESTAÇÃO DE SERVIÇOS,LDA",
    reference: transactionId?.substring(0, 8).toUpperCase()
  };

  useEffect(() => {
    if (transactionId) {
      fetchTransaction();
    }
  }, [transactionId]);

  const fetchTransaction = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          credit_packages (
            name,
            credits,
            price_kwanza
          )
        `)
        .eq('id', transactionId)
        .single();

      if (error) throw error;
      setTransaction(data);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar detalhes da transação.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Progress Steps Skeleton */}
          <div className="h-24 bg-muted/20 rounded-3xl animate-pulse" />
          
          {/* Success Header Skeleton */}
          <div className="h-48 bg-gradient-to-r from-green-500/10 to-green-500/5 rounded-3xl animate-pulse" />
          
          {/* Content Skeleton */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="h-64 bg-muted/20 rounded-3xl animate-pulse" />
            <div className="lg:col-span-2 h-64 bg-muted/20 rounded-3xl animate-pulse" />
          </div>
          
          {/* Timeline Skeleton */}
          <div className="h-32 bg-muted/20 rounded-3xl animate-pulse" />
        </div>
      </DashboardLayout>
    );
  }

  if (!transaction) {
    return (
      <DashboardLayout>
        <motion.div 
          className="flex flex-col items-center justify-center min-h-[60vh] space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <span className="text-3xl">❌</span>
            </div>
            <h3 className="text-2xl font-light gradient-text">Transação não encontrada</h3>
            <p className="text-muted-foreground max-w-md text-center">
              Não conseguimos encontrar os detalhes desta transação. 
              Verifique o link ou entre em contato conosco.
            </p>
          </div>
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div 
        className="space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <CheckoutProgressSteps currentStep={3} />
        </motion.div>

        {/* Enhanced Success Page */}
        <EnhancedSuccessPage 
          transaction={transaction} 
          bankDetails={bankDetails} 
        />
      </motion.div>
    </DashboardLayout>
  );
};

export default CheckoutSuccess;