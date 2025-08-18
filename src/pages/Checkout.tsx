import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, ArrowLeft, Check, Shield, Clock } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { usePackages } from "@/hooks/usePackages";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Checkout = () => {
  const { packageId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { packages, loading } = usePackages();
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
        title: "Pedido criado",
        description: "Seu pedido foi registrado. Faça a transferência bancária para ativar os créditos.",
      });

      navigate(`/checkout/success/${data.id}`);
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar pedido. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-pulse">
          <div className="h-20 bg-muted/20 rounded-3xl"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="h-96 bg-muted/20 rounded-3xl"></div>
            <div className="h-96 bg-muted/20 rounded-3xl"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedPackage) {
    return (
      <DashboardLayout>
        <Card className="card-futuristic">
          <CardContent className="text-center py-16">
            <h3 className="text-xl font-normal mb-2">Pacote não encontrado</h3>
            <p className="text-muted-foreground mb-8">
              O pacote selecionado não existe ou não está disponível.
            </p>
            <Button onClick={() => navigate("/credits")} className="button-futuristic">
              Voltar aos Pacotes
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="glass-card p-8 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="flex items-center gap-4 relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/credits")}
              className="glass-card border-glass-border"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-4xl font-light mb-2 gradient-text">Finalizar Compra</h1>
              <p className="text-muted-foreground text-lg">
                Confirme seu pedido e escolha a forma de pagamento
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Package Details */}
          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="gradient-text">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-2xl glass-card border-glass-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-medium">{selectedPackage.name}</h3>
                  <Badge className="bg-gradient-primary text-white">
                    Mais Popular
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SMS incluídos:</span>
                    <span className="font-medium">{selectedPackage.credits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço por SMS:</span>
                    <span className="font-medium">
                      {((selectedPackage.price_kwanza / selectedPackage.credits) / 100).toFixed(2)} Kz
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Validade:</span>
                    <span className="font-medium">120 dias</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{(selectedPackage.price_kwanza / 1000).toFixed(0)}.000 Kz</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxa de processamento:</span>
                  <span>Grátis</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="gradient-text">
                    {(selectedPackage.price_kwanza / 1000).toFixed(0)}.000 Kz
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-green-500">Economia de 15%</p>
                  <p className="text-muted-foreground">
                    Em comparação com pacotes menores
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="gradient-text flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Forma de Pagamento
              </CardTitle>
              <CardDescription>
                Escolha como deseja pagar pelos seus créditos SMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bank Transfer */}
              <div className="p-6 rounded-2xl border-2 border-primary bg-primary/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-2xl bg-gradient-primary shadow-glow">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Transferência Bancária</h3>
                    <p className="text-sm text-muted-foreground">
                      Recomendado • Processamento rápido
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">BAI, BIC, BFA, Millennium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Confirmação em até 2 horas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">100% seguro e protegido</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <h4 className="font-medium text-blue-400 mb-2">Como funciona:</h4>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Confirme seu pedido clicando no botão abaixo</li>
                  <li>2. Faça a transferência bancária</li>
                  <li>3. Envie o comprovante via WhatsApp</li>
                  <li>4. Seus créditos serão ativados automaticamente</li>
                </ol>
              </div>

              <Button
                onClick={handlePurchase}
                disabled={isProcessing}
                className="w-full button-futuristic text-lg py-6"
                size="lg"
              >
                {isProcessing ? "Processando..." : "Confirmar Pedido"}
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                Ao continuar, você concorda com nossos{" "}
                <a href="/legal/terms" className="text-primary hover:underline">
                  Termos de Uso
                </a>{" "}
                e{" "}
                <a href="/legal/privacy" className="text-primary hover:underline">
                  Política de Privacidade
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Checkout;