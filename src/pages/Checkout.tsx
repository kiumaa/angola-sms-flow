import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { usePackages } from "@/hooks/usePackages";
import { useAuth } from "@/hooks/useAuth";
import { useUserCredits } from "@/hooks/useUserCredits";
import { supabase } from "@/integrations/supabase/client";
import { CheckoutProgressSteps } from "@/components/checkout/CheckoutProgressSteps";
import { EnhancedOrderSummary } from "@/components/checkout/EnhancedOrderSummary";
import { EnhancedPaymentInstructions } from "@/components/checkout/EnhancedPaymentInstructions";
import { motion } from "motion/react";

const Checkout = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { packages, loading } = usePackages();
  const { credits } = useUserCredits();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (packages.length > 0 && packageId) {
      const pkg = packages.find(p => p.id === packageId);
      setSelectedPackage(pkg);
    }
  }, [packages, packageId]);

  const handlePurchase = async () => {
    if (!selectedPackage || !user) return;

    setIsProcessing(true);
    try {
      // Create transaction record
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          package_id: selectedPackage.id,
          amount_kwanza: selectedPackage.price_kwanza,
          credits_purchased: selectedPackage.credits,
          status: 'pending',
          payment_method: 'bank_transfer'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "✅ Pedido Confirmado!",
        description: "Sua solicitação foi registrada com sucesso. Complete o pagamento para ativar os créditos.",
        duration: 4000,
      });

      navigate(`/checkout/success/${data.id}`);
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: "❌ Erro no Pedido",
        description: "Ocorreu um erro ao processar seu pedido. Tente novamente em alguns instantes.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Bank details for transfer
  const bankDetails = {
    bank: "Banco BAI",
    account: "123456789",
    iban: "AO06 0006 0000 1234 5678 9012 3",
    holder: "SMS MARKETING ANGOLA LDA",
    reference: selectedPackage?.id?.substring(0, 8).toUpperCase() || "REF00000"
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Progress Steps Skeleton */}
          <div className="h-24 bg-muted/20 rounded-3xl animate-pulse" />
          
          {/* Header Skeleton */}
          <div className="h-32 bg-gradient-to-r from-muted/20 to-muted/10 rounded-3xl animate-pulse" />
          
          {/* Content Skeleton */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="h-8 bg-muted/20 rounded-2xl animate-pulse" />
              <div className="h-96 bg-muted/20 rounded-3xl animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-muted/20 rounded-2xl animate-pulse" />
              <div className="h-96 bg-muted/20 rounded-3xl animate-pulse" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedPackage) {
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
            <h3 className="text-2xl font-light gradient-text">Pacote não encontrado</h3>
            <p className="text-muted-foreground max-w-md">
              O pacote selecionado não existe ou não está mais disponível. 
              Selecione outro pacote para continuar.
            </p>
          </div>
          <Button 
            onClick={() => navigate("/credits")} 
            className="button-futuristic"
            size="lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Pacotes
          </Button>
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
          <CheckoutProgressSteps currentStep={2} />
        </motion.div>

        {/* Header */}
        <motion.div 
          className="glass-card p-8 bg-gradient-hero relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="flex items-center gap-4 relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/credits")}
              className="glass-card border-glass-border hover:shadow-glow transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex-1">
              <h1 className="text-4xl font-light mb-2 gradient-text">
                Finalizar Compra
              </h1>
              <p className="text-muted-foreground text-lg">
                Confirme seu pedido e complete o pagamento via transferência bancária
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-primary font-medium">Seguro SSL</span>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Enhanced Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <EnhancedOrderSummary 
              selectedPackage={selectedPackage} 
              userCredits={credits}
            />
          </motion.div>

          {/* Enhanced Payment Instructions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <EnhancedPaymentInstructions
              bankDetails={bankDetails}
              amount={selectedPackage.price_kwanza}
              isProcessing={isProcessing}
              onConfirmOrder={handlePurchase}
            />
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Checkout;