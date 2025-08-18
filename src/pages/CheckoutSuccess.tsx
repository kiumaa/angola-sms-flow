import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Copy, Phone, ArrowRight, Home } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CheckoutSuccess = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  const bankDetails = {
    bank: "Banco BAI",
    account: "123456789",
    iban: "AO06 0006 0000 1234 5678 9012 3",
    holder: "SMS MARKETING ANGOLA LDA",
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Informação copiada para a área de transferência.",
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-pulse">
          <div className="h-20 bg-muted/20 rounded-3xl"></div>
          <div className="h-96 bg-muted/20 rounded-3xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!transaction) {
    return (
      <DashboardLayout>
        <Card className="card-futuristic">
          <CardContent className="text-center py-16">
            <h3 className="text-xl font-normal mb-2">Transação não encontrada</h3>
            <p className="text-muted-foreground mb-8">
              Não conseguimos encontrar os detalhes desta transação.
            </p>
            <Button onClick={() => navigate("/credits")} className="button-futuristic">
              Voltar aos Créditos
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Success Header */}
        <Card className="card-futuristic border-green-500/30 bg-green-500/5">
          <CardContent className="text-center py-12">
            <div className="p-6 rounded-3xl bg-green-500/20 w-fit mx-auto mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            </div>
            <h1 className="text-3xl font-light mb-4 gradient-text">
              Pedido Confirmado!
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Seu pedido foi registrado com sucesso. Complete o pagamento para ativar seus créditos SMS.
            </p>
            <Badge className="mt-4 bg-green-500/20 text-green-400 px-4 py-2">
              Pedido #{bankDetails.reference}
            </Badge>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Transaction Details */}
          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="gradient-text">Detalhes do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-2xl glass-card border-glass-border">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-muted-foreground">Pacote:</span>
                  <span className="font-medium">{transaction.credit_packages?.name}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-muted-foreground">SMS incluídos:</span>
                  <span className="font-medium">{transaction.credits_purchased?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-muted-foreground">Valor total:</span>
                  <span className="font-medium text-lg gradient-text">
                    {(transaction.amount_kwanza / 1000).toFixed(0)}.000 Kz
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className="bg-yellow-500/20 text-yellow-400">
                    Aguardando Pagamento
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card className="card-futuristic border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="text-primary">Instruções de Pagamento</CardTitle>
              <CardDescription>
                Faça a transferência bancária com os dados abaixo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Banco", value: bankDetails.bank },
                { label: "Titular", value: bankDetails.holder },
                { label: "Conta", value: bankDetails.account },
                { label: "IBAN", value: bankDetails.iban },
                { label: "Referência", value: bankDetails.reference }
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-2xl glass-card border-glass-border">
                  <span className="text-muted-foreground font-medium">{item.label}:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{item.value}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(item.value)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="card-futuristic border-blue-500/30 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-blue-400">Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="p-4 rounded-2xl bg-blue-500/20 w-fit mx-auto mb-3">
                  <span className="text-2xl font-bold text-blue-400">1</span>
                </div>
                <h3 className="font-medium mb-2">Faça a Transferência</h3>
                <p className="text-sm text-muted-foreground">
                  Use os dados bancários acima para fazer a transferência
                </p>
              </div>
              
              <div className="text-center">
                <div className="p-4 rounded-2xl bg-blue-500/20 w-fit mx-auto mb-3">
                  <Phone className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="font-medium mb-2">Envie o Comprovante</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  WhatsApp: +244 900 000 000
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="glass-card border-glass-border"
                  onClick={() => window.open(`https://wa.me/244900000000?text=Comprovante de pagamento - Pedido ${bankDetails.reference}`, '_blank')}
                >
                  Enviar Comprovante
                </Button>
              </div>
              
              <div className="text-center">
                <div className="p-4 rounded-2xl bg-green-500/20 w-fit mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="font-medium mb-2">Créditos Ativados</h3>
                <p className="text-sm text-muted-foreground">
                  Seus créditos serão ativados em até 2 horas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="glass-card border-glass-border"
          >
            <Home className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <Button
            onClick={() => navigate("/campaigns/new")}
            className="button-futuristic"
          >
            Criar Primeira Campanha
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CheckoutSuccess;