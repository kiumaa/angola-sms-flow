import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { showInfoToast } from "@/components/shared/FeedbackToast";
import { usePackages } from "@/hooks/usePackages";
import { useAuth } from "@/hooks/useAuth";
import { useUserCredits } from "@/hooks/useUserCredits";
import { supabase } from "@/integrations/supabase/client";
import { CheckoutProgressSteps } from "@/components/checkout/CheckoutProgressSteps";
import { EnhancedOrderSummary } from "@/components/checkout/EnhancedOrderSummary";
import { EnhancedPaymentInstructions } from "@/components/checkout/EnhancedPaymentInstructions";
import { EkwanzaPaymentModal } from "@/components/checkout/EkwanzaPaymentModal";
import { useEkwanzaPayment, type PaymentMethod } from "@/hooks/useEkwanzaPayment";
import type { PaymentResponse } from "@/hooks/useEkwanzaPayment";
import { motion } from "motion/react";

const Checkout = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { packages, loading } = usePackages();
  const { credits, refresh: refreshCredits } = useUserCredits();
  const { createPayment, checkPaymentStatus, isCreating } = useEkwanzaPayment();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // MCX Express é o método padrão (gateway principal)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | 'bank_transfer' | null>('mcx');
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [showEkwanzaModal, setShowEkwanzaModal] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (packages.length > 0 && packageId) {
      const pkg = packages.find(p => p.id === packageId);
      setSelectedPackage(pkg);
    }
  }, [packages, packageId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const startPolling = (paymentId: string) => {
    if (!paymentId) {
      console.error('❌ Payment ID não fornecido para polling');
      return;
    }

    console.log('🔄 Iniciando polling para payment:', paymentId);
    
    // Poll every 10 seconds
    const interval = setInterval(async () => {
      try {
        const status = await checkPaymentStatus(paymentId);
        
        if (!status) {
          console.warn('⚠️ Status não retornado para payment:', paymentId);
          return;
        }
        
        if (status.status === 'paid') {
          clearInterval(interval);
          setPollingInterval(null);
          
          toast({
            title: "✅ Pagamento Confirmado!",
            description: "Seus créditos foram adicionados com sucesso.",
            duration: 5000,
          });
          
          setShowEkwanzaModal(false);
          refreshCredits();
          navigate(`/checkout/success/${paymentData?.transaction_id}`);
        } else if (status.status === 'expired') {
          clearInterval(interval);
          setPollingInterval(null);
          
          toast({
            title: "⏰ Pagamento Expirado",
            description: "O tempo para completar o pagamento expirou. Crie um novo pagamento.",
            variant: "destructive",
            duration: 5000,
          });
          
          setShowEkwanzaModal(false);
        }
      } catch (error) {
        console.error('❌ Erro ao verificar status do pagamento:', error);
        // Não limpar o intervalo em caso de erro - continuar tentando
      }
    }, 10000); // 10 seconds
    
    setPollingInterval(interval);
  };

  const handleEkwanzaPayment = async (paymentMethod: PaymentMethod, mobileNumber?: string) => {
    if (!selectedPackage || !user) {
      console.error('❌ Missing required data:', { selectedPackage: !!selectedPackage, user: !!user });
      toast({
        title: "❌ Erro",
        description: "Dados incompletos. Por favor, recarregue a página e tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    try {
      console.log('🔄 Iniciando criação de pagamento MCX:', {
        package_id: selectedPackage.id,
        payment_method: paymentMethod,
        has_mobile_number: !!mobileNumber
      });

      const payment = await createPayment({
        package_id: selectedPackage.id,
        payment_method: paymentMethod,
        mobile_number: mobileNumber
      });

      if (payment) {
        console.log('✅ Pagamento criado com sucesso:', payment.payment_id);
        setPaymentData(payment);
        setShowEkwanzaModal(true);
        startPolling(payment.payment_id);
      } else if (paymentMethod === 'referencia') {
        // If Referência failed, suggest MCX as fallback
        showInfoToast(
          "💡 Sugestão de Método Alternativo",
          "A Referência EMIS não está disponível. Recomendamos usar Multicaixa Express (MCX) ou Transferência Bancária como alternativa."
        );
        // Auto-switch to MCX
        setSelectedPaymentMethod('mcx');
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao criar pagamento:', error);
      toast({
        title: "❌ Erro Inesperado",
        description: "Ocorreu um erro ao processar o pagamento. Por favor, tente novamente ou use Transferência Bancária.",
        variant: "destructive",
        duration: 6000,
      });
      
      // Log detalhado para diagnóstico
      if (error instanceof Error) {
        console.error('📊 Detalhes do erro:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
    }
  };

  const handleBankTransferPayment = async () => {
    if (!selectedPackage || !user) return;

    setIsProcessing(true);
    try {
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
    bank: "BFA | Banco de Fomento Angola, S.A.",
    account: "123456789",
    iban: "0006 0000 3442 5465 3012.5",
    holder: "KB AGENCY- PRESTAÇÃO DE SERVIÇOS,LDA",
    reference: selectedPackage?.id?.substring(0, 8)?.toUpperCase() || "REF00000"
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

        {selectedPackage ? (
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
                isProcessing={isProcessing || isCreating}
                onConfirmOrder={handleBankTransferPayment}
                onEkwanzaPayment={handleEkwanzaPayment}
                selectedPaymentMethod={selectedPaymentMethod}
                onPaymentMethodChange={setSelectedPaymentMethod}
              />
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">Carregando informações do pacote...</p>
          </motion.div>
        )}

        {/* É-kwanza Payment Modal */}
        <EkwanzaPaymentModal
          isOpen={showEkwanzaModal}
          onClose={() => {
            setShowEkwanzaModal(false);
            if (pollingInterval) {
              clearInterval(pollingInterval);
              setPollingInterval(null);
            }
          }}
          paymentData={paymentData}
          onStatusChange={(status) => {
            if (status === 'paid') {
              refreshCredits();
            }
          }}
        />
      </motion.div>
    </DashboardLayout>
  );
};

export default Checkout;