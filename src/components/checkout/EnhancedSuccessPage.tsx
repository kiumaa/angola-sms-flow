import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Copy, 
  Phone, 
  ArrowRight, 
  Home,
  Clock,
  Shield,
  CreditCard,
  MessageSquare,
  Check,
  QrCode,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "motion/react";

interface Transaction {
  id: string;
  amount_kwanza: number;
  credits_purchased: number;
  status: string;
  created_at: string;
  credit_packages?: {
    name: string;
    credits: number;
    price_kwanza: number;
  };
}

interface BankDetails {
  bank: string;
  account: string;
  iban: string;
  holder: string;
  reference: string;
}

interface EnhancedSuccessPageProps {
  transaction: Transaction;
  bankDetails: BankDetails;
}

export const EnhancedSuccessPage = ({ transaction, bankDetails }: EnhancedSuccessPageProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    
    toast({
      title: "✅ Copiado!",
      description: `${field} copiado para a área de transferência.`,
      duration: 2000,
    });
  };

  const copyAllBankDetails = () => {
    const allDetails = `
Banco: ${bankDetails.bank}
Titular: ${bankDetails.holder}
Conta: ${bankDetails.account}
IBAN: ${bankDetails.iban}
Referência: ${bankDetails.reference}
Valor: ${(transaction.amount_kwanza / 1000).toFixed(0)}.000 Kz
    `.trim();
    
    copyToClipboard(allDetails, "Todos os dados bancários");
  };

  const openWhatsApp = () => {
    const message = `Olá! Envio comprovante de pagamento do Pedido ${bankDetails.reference}. Valor: ${(transaction.amount_kwanza / 1000).toFixed(0)}.000 Kz para ativação de ${transaction.credits_purchased?.toLocaleString()} créditos SMS.`;
    window.open(`https://wa.me/244933493788?text=${encodeURIComponent(message)}`, '_blank');
  };

  const timelineSteps = [
    {
      id: 1,
      title: "Pedido Confirmado",
      description: "Seu pedido foi registrado no sistema",
      icon: CheckCircle,
      status: "completed",
      time: "Agora"
    },
    {
      id: 2,
      title: "Aguardando Transferência",
      description: "Faça a transferência bancária com os dados fornecidos",
      icon: CreditCard,
      status: currentStep >= 2 ? "current" : "pending",
      time: "Em andamento"
    },
    {
      id: 3,
      title: "Envio do Comprovante",
      description: "Envie o comprovante via WhatsApp",
      icon: MessageSquare,
      status: currentStep >= 3 ? "current" : "pending",
      time: "Após transferência"
    },
    {
      id: 4,
      title: "Créditos Ativados",
      description: "Seus créditos serão ativados automaticamente",
      icon: Shield,
      status: currentStep >= 4 ? "completed" : "pending",
      time: "Até 2 horas"
    }
  ];

  const bankDetailsList = [
    { label: "Banco", value: bankDetails.bank, field: "banco", icon: CreditCard },
    { label: "Titular", value: bankDetails.holder, field: "titular", icon: Shield },
    { label: "Conta", value: bankDetails.account, field: "conta", icon: Copy },
    { label: "IBAN", value: bankDetails.iban, field: "iban", icon: Copy },
    { label: "Referência", value: bankDetails.reference, field: "referencia", icon: AlertCircle }
  ];

  return (
    <div className="space-y-8">
      {/* Success Header with Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="card-futuristic border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/10 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5 animate-pulse" />
          
          <CardContent className="text-center py-16 relative">
            <motion.div 
              className="p-8 rounded-full bg-green-500/20 w-fit mx-auto mb-8 relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-green-500/30"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h1 className="text-4xl font-light mb-4 gradient-text">
                Pedido Confirmado!
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                Parabéns! Seu pedido foi registrado com sucesso. 
                Complete o pagamento seguindo as instruções abaixo para ativar seus <strong>{transaction.credits_purchased?.toLocaleString()}</strong> créditos SMS.
              </p>
            </motion.div>
            
            <motion.div
              className="flex flex-wrap items-center justify-center gap-4 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Badge className="bg-green-500/20 text-green-400 px-6 py-3 text-lg">
                Pedido #{bankDetails.reference}
              </Badge>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Transaction Details */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-1"
        >
          <Card className="card-futuristic">
            <CardHeader>
              <CardTitle className="gradient-text flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Detalhes do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 rounded-2xl glass-card border-glass-border space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pacote:</span>
                  <span className="font-medium">{transaction.credit_packages?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">SMS incluídos:</span>
                  <span className="font-medium">{transaction.credits_purchased?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor total:</span>
                  <span className="font-medium text-xl gradient-text">
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

              {/* Progress Indicator */}
              <div className="space-y-3">
                <h4 className="font-medium">Progresso do Pedido</h4>
                <Progress value={25} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  Etapa 1 de 4 concluída
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Instructions - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="card-futuristic border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="text-primary flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Instruções de Pagamento
              </CardTitle>
              <CardDescription className="text-lg">
                Complete sua transferência bancária para ativar os créditos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={copyAllBankDetails}
                  className="button-futuristic flex-1"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Todos os Dados
                </Button>
                <Button
                  onClick={openWhatsApp}
                  variant="outline"
                  className="glass-card border-green-500/30 text-green-400 hover:bg-green-500/10 flex-1"
                  size="sm"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Comprovante
                </Button>
              </div>

              {/* Bank Details Grid */}
              <div className="grid gap-3">
                {bankDetailsList.map((item, index) => (
                  <motion.div 
                    key={index}
                    className="flex justify-between items-center p-4 rounded-2xl glass-card border-glass-border group hover:shadow-glow transition-all duration-300"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground font-medium">{item.label}:</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm bg-muted/20 px-3 py-1 rounded-lg">
                        {item.value}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(item.value, item.label)}
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {copiedField === item.label ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Important Notice */}
              <motion.div 
                className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-400 mb-1">
                      ⚠️ Importante: Use exatamente a referência fornecida
                    </p>
                    <p className="text-muted-foreground">
                      A referência <strong>{bankDetails.reference}</strong> é essencial para identificar seu pagamento automaticamente.
                    </p>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Interactive Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="card-futuristic border-blue-500/30 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Próximos Passos
            </CardTitle>
            <CardDescription>
              Acompanhe o progresso do seu pedido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              {timelineSteps.map((step, index) => (
                <motion.div 
                  key={step.id}
                  className="text-center group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                >
                  <div className={`
                    p-6 rounded-2xl w-fit mx-auto mb-4 transition-all duration-300 relative
                    ${step.status === 'completed' ? 'bg-green-500/20 shadow-glow' : 
                      step.status === 'current' ? 'bg-blue-500/20 animate-pulse' : 
                      'bg-muted/20'}
                  `}>
                    <step.icon className={`
                      h-8 w-8 mx-auto
                      ${step.status === 'completed' ? 'text-green-500' : 
                        step.status === 'current' ? 'text-blue-400' : 
                        'text-muted-foreground'}
                    `} />
                    {step.status === 'current' && (
                      <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/30 animate-pulse" />
                    )}
                  </div>
                  
                  <h3 className={`
                    font-medium mb-2 transition-colors duration-300
                    ${step.status === 'completed' ? 'text-green-500' : 
                      step.status === 'current' ? 'text-blue-400' : 
                      'text-muted-foreground'}
                  `}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {step.description}
                  </p>
                  <p className="text-xs text-primary font-medium">
                    {step.time}
                  </p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        className="flex flex-col sm:flex-row justify-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="glass-card border-glass-border hover:shadow-glow transition-all duration-300"
          size="lg"
        >
          <Home className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>
        <Button
          onClick={() => navigate("/quick-send")}
          className="button-futuristic group"
          size="lg"
        >
          Preparar Primeiro Envio
          <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </motion.div>
    </div>
  );
};