import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, CreditCard, Building2, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Checkout = () => {
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("offline");
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const packages = [
    {
      id: "basic",
      name: "Pacote Básico",
      credits: 100,
      price: 10000,
      description: "Ideal para pequenos negócios",
      popular: false
    },
    {
      id: "medium", 
      name: "Pacote Médio",
      credits: 400,
      price: 38000,
      description: "Para empresas em crescimento",
      popular: true,
      savings: "5% de desconto"
    },
    {
      id: "premium",
      name: "Pacote Premium", 
      credits: 1000,
      price: 90000,
      description: "Para grandes volumes",
      popular: false,
      savings: "10% de desconto"
    }
  ];

  const handlePackageSelect = (pkg: any) => {
    setSelectedPackage(pkg);
  };

  const handleOfflinePayment = async () => {
    if (!selectedPackage || !user) return;

    setIsProcessing(true);

    try {
      // Create pending transaction
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount_kwanza: selectedPackage.price,
          credits_purchased: selectedPackage.credits,
          status: 'pending',
          payment_method: 'bank_transfer',
          payment_reference: notes
        });

      if (error) throw error;

      toast({
        title: "Transação registrada!",
        description: "Siga as instruções de transferência e envie o comprovante.",
      });

    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar transação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const bankingInfo = {
    bank: "BFA - Banco de Fomento Angola, S.A.",
    agency: "-", 
    account: "-",
    iban: "AO06 0006 0000 3442 5465 3012.5",
    holder: "KB AGENCY - PRESTAÇÃO DE SERVIÇOS, LDA"
  };

  if (!selectedPackage) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Comprar Créditos</h1>
            <p className="text-muted-foreground mt-2">
              Escolha o pacote ideal para suas necessidades
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card 
                key={pkg.id} 
                className={`relative cursor-pointer transition-all hover:shadow-lg ${
                  pkg.popular ? 'ring-2 ring-primary scale-105' : ''
                }`}
                onClick={() => handlePackageSelect(pkg)}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <div className="text-4xl font-bold text-primary">
                    {pkg.price.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">Kz</span>
                  </div>
                  <CardDescription>
                    {pkg.credits} SMS incluídos
                    {pkg.savings && (
                      <span className="block text-secondary font-medium">{pkg.savings}</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground mb-4">{pkg.description}</p>
                  <p className="text-center text-sm text-muted-foreground">
                    {(pkg.price / pkg.credits).toFixed(0)} Kz por SMS
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const progressSteps = ["Escolher Pacote", "Método de Pagamento", "Confirmação"];
  const currentStep = paymentMethod === "offline" && receipt ? 2 : 1;

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Finalizar Compra</h1>
            <p className="text-muted-foreground mt-2">
              Complete sua compra de créditos SMS
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setSelectedPackage(null)}
          >
            Voltar aos Pacotes
          </Button>
        </div>

        {/* Progress Steps */}
        <ProgressSteps 
          steps={progressSteps} 
          currentStep={currentStep}
          className="max-w-2xl mx-auto"
        />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Pacote:</span>
                  <span className="font-medium">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Créditos SMS:</span>
                  <span className="font-medium">{selectedPackage.credits}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">{selectedPackage.price.toLocaleString()} Kz</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <div className="lg:col-span-2">
            <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="offline" className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span>Transferência Bancária</span>
                </TabsTrigger>
                <TabsTrigger value="appypay" className="flex items-center space-x-2" disabled>
                  <CreditCard className="h-4 w-4" />
                  <span>Pagamentos Digitais (Em breve)</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="offline" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5" />
                      <span>Pagamento por Transferência Bancária</span>
                    </CardTitle>
                    <CardDescription>
                      Transfira o valor para a conta abaixo e envie o comprovante
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Banking Details */}
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <h4 className="font-semibold mb-3">Dados para Transferência:</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Banco:</span>
                          <p className="font-medium">{bankingInfo.bank}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Agência:</span>
                          <p className="font-medium">{bankingInfo.agency}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Conta:</span>
                          <p className="font-medium">{bankingInfo.account}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">IBAN:</span>
                          <p className="font-medium">{bankingInfo.iban}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Titular:</span>
                          <p className="font-medium">{bankingInfo.holder}</p>
                        </div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">📋 Instruções de Pagamento</h4>
                      <div className="text-blue-800 text-sm space-y-1">
                        <p>1. Transfira o valor exato para a conta indicada acima</p>
                        <p>2. Use como referência: <strong>SMS-{user?.id?.slice(-6)}</strong></p>
                        <p>3. Envie o comprovante através do formulário abaixo</p>
                        <p>4. Aguarde até 24h para confirmação do pagamento</p>
                      </div>
                    </div>

                    {/* Upload Receipt */}
                    <div className="space-y-4">
                      <Label htmlFor="receipt">Comprovante de Transferência *</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Arraste o comprovante aqui ou clique para selecionar
                        </p>
                        <Input 
                          id="receipt"
                          type="file" 
                          accept="image/*,application/pdf"
                          className="max-w-xs mx-auto"
                          onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                        />
                      </div>
                      {receipt && (
                        <p className="text-sm text-success">
                          ✓ Arquivo selecionado: {receipt.name}
                        </p>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">Referência da Transferência</Label>
                      <Textarea
                        id="notes"
                        placeholder={`Digite aqui a referência da transferência: SMS-${user?.id?.slice(-6) || 'XXXXXX'}`}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use a referência sugerida acima para facilitar a identificação do pagamento
                      </p>
                    </div>

                    <Button 
                      onClick={handleOfflinePayment}
                      disabled={isProcessing || !receipt}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? "Registrando transação..." : "Confirmar e Enviar Comprovante"}
                    </Button>
                    
                    {!receipt && (
                      <p className="text-sm text-amber-600 text-center">
                        ⚠️ Por favor, anexe o comprovante de transferência antes de confirmar
                      </p>
                    )}

                    <div className="text-sm text-muted-foreground">
                      <p>📧 Após o envio, nossa equipe verificará o pagamento em até 24 horas.</p>
                      <p>💬 Dúvidas? Entre em contato: suporte@smsmarketing.ao</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="appypay" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5" />
                      <span>Pagamentos Digitais</span>
                    </CardTitle>
                    <CardDescription>
                      Métodos de pagamento digital em desenvolvimento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <h4 className="font-medium mb-2">🏦 Multicaixa Express</h4>
                        <p className="text-sm text-muted-foreground">
                          Pagamentos via terminais Multicaixa - <span className="text-amber-600">Em desenvolvimento</span>
                        </p>
                      </div>
                      
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <h4 className="font-medium mb-2">📱 Unitel Money</h4>
                        <p className="text-sm text-muted-foreground">
                          Pagamentos via carteira digital - <span className="text-amber-600">Em desenvolvimento</span>
                        </p>
                      </div>
                      
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <h4 className="font-medium mb-2">💳 Débito Direto</h4>
                        <p className="text-sm text-muted-foreground">
                          Pagamentos por referência bancária - <span className="text-amber-600">Em desenvolvimento</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-center py-6">
                      <CheckCircle className="h-12 w-12 mx-auto text-primary mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Lançamento em breve!</h3>
                      <p className="text-muted-foreground text-sm">
                        Estamos finalizando as integrações para oferecer mais opções de pagamento.
                        Por enquanto, utilize a transferência bancária.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Checkout;