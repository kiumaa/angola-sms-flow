import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Plus, Calendar } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

const Credits = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const smsCredits = parseInt(localStorage.getItem("smsCredits") || "0");
  const { toast } = useToast();

  const handlePurchase = (planName: string, smsAmount: number) => {
    setSelectedPlan(planName);
    
    // Simulate purchase process
    setTimeout(() => {
      const newCredits = smsCredits + smsAmount;
      localStorage.setItem("smsCredits", newCredits.toString());
      
      toast({
        title: "Compra realizada com sucesso!",
        description: `${smsAmount} SMS foram adicionados à sua conta.`,
      });
      
      setSelectedPlan(null);
      // Refresh page to update credits display
      window.location.reload();
    }, 2000);
  };

  const pricingPlans = [
    {
      name: "Básico",
      price: "10.000",
      sms: 100,
      pricePerSms: 100,
      popular: false,
      features: [
        "100 SMS incluídos",
        "Dashboard básico",
        "Suporte por email",
        "Validade: 90 dias",
        "Relatórios básicos"
      ]
    },
    {
      name: "Intermediário",
      price: "38.000",
      sms: 400,
      pricePerSms: 95,
      popular: true,
      savings: "5% de desconto",
      features: [
        "400 SMS incluídos",
        "Suporte prioritário",
        "Relatórios avançados",
        "Agendamento de campanhas",
        "Validade: 120 dias",
        "API básica"
      ]
    },
    {
      name: "Avançado",
      price: "90.000",
      sms: 1000,
      pricePerSms: 90,
      popular: false,
      savings: "10% de desconto",
      features: [
        "1.000 SMS incluídos",
        "API completa",
        "Webhooks personalizados",
        "Suporte por telefone",
        "Validade: 180 dias",
        "Relatórios premium"
      ]
    }
  ];

  const recentPurchases = [
    {
      date: "2024-11-26",
      plan: "Registro da conta",
      sms: 50,
      amount: "Grátis",
      status: "Concluído"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Créditos SMS</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus créditos e compre mais SMS para suas campanhas
          </p>
        </div>

        {/* Current Balance */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Saldo Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary mb-2">
              {smsCredits} SMS
            </div>
            <p className="text-muted-foreground">
              Créditos disponíveis para suas campanhas
            </p>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Pacotes Disponíveis</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-primary scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                      Mais Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-primary">
                    {plan.price} <span className="text-lg font-normal text-muted-foreground">Kz</span>
                  </div>
                  <CardDescription>
                    {plan.sms} SMS incluídos
                    {plan.savings && (
                      <span className="block text-secondary font-medium">{plan.savings}</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="h-4 w-4 text-secondary mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground">
                      {plan.pricePerSms} Kz por SMS
                    </p>
                  </div>

                  <Button 
                    className={`w-full ${plan.popular ? 'btn-gradient' : ''}`}
                    onClick={() => handlePurchase(plan.name, plan.sms)}
                    disabled={selectedPlan === plan.name}
                  >
                    {selectedPlan === plan.name ? "Processando..." : "Comprar Agora"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Payment Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Como Funciona o Pagamento</CardTitle>
            <CardDescription>
              Processo simples em 3 passos para carregar seus créditos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Escolha o Pacote</h3>
                <p className="text-sm text-muted-foreground">
                  Selecione o pacote que melhor atende suas necessidades
                </p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Faça a Transferência</h3>
                <p className="text-sm text-muted-foreground">
                  Realize o pagamento via transferência bancária em Kwanzas
                </p>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <span className="font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Receba os Créditos</h3>
                <p className="text-sm text-muted-foreground">
                  Seus SMS são creditados automaticamente após confirmação
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Histórico de Compras
            </CardTitle>
            <CardDescription>
              Suas últimas transações e carregamentos de créditos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPurchases.map((purchase, index) => (
                <div key={index} className="flex justify-between items-center p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-semibold">{purchase.plan}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(purchase.date).toLocaleDateString('pt-AO')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{purchase.sms} SMS</p>
                    <p className="text-sm text-muted-foreground">{purchase.amount}</p>
                  </div>
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                      {purchase.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Credits;