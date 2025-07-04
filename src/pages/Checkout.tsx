import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, CreditCard, Building2, CheckCircle, Clock } from "lucide-react";
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

  // Load selected package from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('selectedPackage');
    if (stored) {
      setSelectedPackage(JSON.parse(stored));
      sessionStorage.removeItem('selectedPackage'); // Clean up
    }
  }, []);

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
      // Create credit request (replaces direct transaction)
      const { error } = await supabase
        .from('credit_requests')
        .insert({
          user_id: user.id,
          package_id: selectedPackage.id,
          amount_kwanza: selectedPackage.price,
          credits_requested: selectedPackage.credits,
          status: 'pending',
          payment_reference: notes || `SMS-${user.id.slice(-6)}`
        });

      if (error) throw error;

      toast({
        title: "Solicitação de créditos enviada!",
        description: "Aguarde aprovação do administrador após confirmação do pagamento.",
      });

    } catch (error) {
      console.error('Error creating credit request:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar solicitação. Tente novamente.",
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

          {/* Como Funciona o Pagamento */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Como Funciona o Pagamento</CardTitle>
              <CardDescription className="text-blue-700">
                Processo simples em 3 passos para carregar seus créditos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-700 font-bold text-lg">1</span>
                  </div>
                  <h3 className="font-semibold text-blue-900 mb-2">Escolha o Pacote</h3>
                  <p className="text-blue-700 text-sm">
                    Selecione o pacote que melhor atende suas necessidades
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-700 font-bold text-lg">2</span>
                  </div>
                  <h3 className="font-semibold text-blue-900 mb-2">Faça a Transferência</h3>
                  <p className="text-blue-700 text-sm">
                    Realize o pagamento via transferência bancária em Kwanzas
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-700 font-bold text-lg">3</span>
                  </div>
                  <h3 className="font-semibold text-blue-900 mb-2">Receba os Créditos</h3>
                  <p className="text-blue-700 text-sm">
                    Seus SMS são creditados automaticamente após confirmação
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                <TabsTrigger value="appypay" className="flex items-center space-x-2 opacity-50 cursor-not-allowed" disabled>
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

                    {/* WhatsApp Confirmation */}
                    <div className="space-y-4">
                      <Label>Confirmação via WhatsApp</Label>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-100 rounded-full p-2">
                            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-medium text-green-900 mb-1">Confirme via WhatsApp</h4>
                            <p className="text-green-700 text-sm">
                              Após realizar a transferência, clique no botão abaixo para confirmar via WhatsApp
                            </p>
                          </div>
                        </div>
                      </div>
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
                      onClick={() => {
                        const whatsappMessage = `Olá, confirmei a transferência de SMS-${user?.id?.slice(-6)} no valor de ${selectedPackage.price.toLocaleString()} Kz. Obrigado!`;
                        const whatsappUrl = `https://wa.me/244933493788?text=${encodeURIComponent(whatsappMessage)}`;
                        window.open(whatsappUrl, '_blank');
                        handleOfflinePayment();
                      }}
                      disabled={isProcessing}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      {isProcessing ? "Registrando..." : "Confirmar via WhatsApp"}
                    </Button>

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
                    <div className="grid gap-4 opacity-60">
                      <div className="p-4 border rounded-lg bg-gray-100 cursor-not-allowed">
                        <h4 className="font-medium mb-2 text-gray-600">🏦 Multicaixa Express</h4>
                        <p className="text-sm text-gray-500">
                          Pagamentos via terminais Multicaixa - <span className="text-amber-600 font-medium">Temporariamente Indisponível</span>
                        </p>
                      </div>
                      
                      <div className="p-4 border rounded-lg bg-gray-100 cursor-not-allowed">
                        <h4 className="font-medium mb-2 text-gray-600">📱 Unitel Money</h4>
                        <p className="text-sm text-gray-500">
                          Pagamentos via carteira digital - <span className="text-amber-600 font-medium">Temporariamente Indisponível</span>
                        </p>
                      </div>
                      
                      <div className="p-4 border rounded-lg bg-gray-100 cursor-not-allowed">
                        <h4 className="font-medium mb-2 text-gray-600">💳 Débito Direto</h4>
                        <p className="text-sm text-gray-500">
                          Pagamentos por referência bancária - <span className="text-amber-600 font-medium">Temporariamente Indisponível</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-center py-6 bg-amber-50 rounded-lg border border-amber-200">
                      <Clock className="h-12 w-12 mx-auto text-amber-500 mb-4" />
                      <h3 className="text-lg font-semibold mb-2 text-amber-900">Métodos Temporariamente Indisponíveis</h3>
                      <p className="text-amber-700 text-sm">
                        Nossos gateways digitais estão em manutenção programada.
                        Por favor, utilize a transferência bancária por enquanto.
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