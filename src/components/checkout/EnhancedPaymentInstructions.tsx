import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CreditCard, 
  Copy, 
  Check, 
  Shield, 
  Clock, 
  QrCode,
  Eye,
  EyeOff,
  ArrowRight,
  HelpCircle,
  Phone,
  Building2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "motion/react";

interface BankDetails {
  bank: string;
  account: string;
  iban: string;
  holder: string;
  reference: string;
}

interface EnhancedPaymentInstructionsProps {
  bankDetails: BankDetails;
  amount: number;
  isProcessing: boolean;
  onConfirmOrder: () => void;
}

export const EnhancedPaymentInstructions = ({ 
  bankDetails, 
  amount, 
  isProcessing, 
  onConfirmOrder 
}: EnhancedPaymentInstructionsProps) => {
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    
    toast({
      title: "Copiado!",
      description: `${field} copiado para a área de transferência.`,
      duration: 2000,
    });
  };

  const generateQRCodeData = () => {
    return `BAI_TRANSFER:${bankDetails.iban}:${amount}:${bankDetails.reference}`;
  };

  const paymentSteps = [
    {
      title: "Acesse o seu banco",
      description: "Entre no app ou site do seu banco (BAI, BIC, BFA, etc.)",
      icon: Phone,
      detail: "Use o app móvel para maior comodidade"
    },
    {
      title: "Selecione Transferência",
      description: "Escolha 'Transferir para outra conta' ou 'Pagamento'",
      icon: CreditCard,
      detail: "Procure por 'Transferências' no menu principal"
    },
    {
      title: "Insira os dados",
      description: "Use os dados bancários fornecidos abaixo",
      icon: Copy,
      detail: "Cole os dados copiados para evitar erros"
    },
    {
      title: "Confirme e envie",
      description: "Revise os dados e confirme a transferência",
      icon: Check,
      detail: "Guarde o comprovante para enviar via WhatsApp"
    }
  ];

  const securityFeatures = [
    { icon: Shield, text: "Dados bancários verificados", color: "text-green-500" },
    { icon: Clock, text: "Confirmação em até 2 horas", color: "text-blue-500" },
    { icon: Check, text: "Suporte 24/7 disponível", color: "text-purple-500" }
  ];

  return (
    <Card className="card-futuristic">
      <CardHeader>
        <CardTitle className="gradient-text flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Forma de Pagamento
        </CardTitle>
        <CardDescription>
          Transferência bancária segura e rápida
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Payment Method Selection */}
        <motion.div 
          className="p-6 rounded-2xl border-2 border-primary bg-primary/5"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-2xl bg-gradient-primary shadow-glow">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium">Transferência Bancária</h3>
              <p className="text-sm text-muted-foreground">
                Recomendado • Processamento automático
              </p>
            </div>
            <Badge className="ml-auto bg-green-500/20 text-green-400">
              Mais Rápido
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {securityFeatures.map((feature, index) => (
              <motion.div 
                key={index}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <feature.icon className={`h-4 w-4 ${feature.color}`} />
                <span className="text-xs">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bank Details Section */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Dados para Transferência</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="glass-card border-glass-border"
              >
                {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showDetails ? "Ocultar" : "Mostrar"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTutorial(!showTutorial)}
                className="glass-card border-glass-border"
              >
                <HelpCircle className="h-4 w-4" />
                Tutorial
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {showDetails && (
              <motion.div 
                className="space-y-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {[
                  { label: "Banco", value: bankDetails.bank, field: "banco" },
                  { label: "Titular", value: bankDetails.holder, field: "titular" },
                  { label: "Conta", value: bankDetails.account, field: "conta" },
                  { label: "IBAN", value: `AO06 ${bankDetails.iban}`, field: "iban" },
                  { label: "Referência", value: bankDetails.reference, field: "referencia" }
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    className="flex justify-between items-center p-4 rounded-2xl glass-card border-glass-border group hover:shadow-glow transition-all duration-300"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <span className="text-muted-foreground font-medium">{item.label}:</span>
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
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tutorial Section */}
        <AnimatePresence>
          {showTutorial && (
            <motion.div 
              className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h4 className="font-medium text-blue-400 flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Como fazer a transferência:
              </h4>
              <div className="space-y-3">
                {paymentSteps.map((step, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-xl bg-background/50"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <step.icon className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium">{step.title}</h5>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                      <p className="text-xs text-blue-400 mt-1">
                        💡 {step.detail}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
         </AnimatePresence>

        {/* Outros Métodos de Pagamento (Em Breve) */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h4 className="font-medium text-muted-foreground">Outros Métodos de Pagamento (Em Breve)</h4>
          
          <div className="space-y-3">
            {[
              {
                name: "Multicaixa Express",
                description: "Pagamento via Multicaixa Express",
                logo: "/multicaixa-express-logo.png",
                color: "from-orange-500/10 to-orange-500/5",
                icon: "📱"
              },
              {
                name: "Pagamento por Referência",
                description: "Gere uma referência para pagamento",
                logo: "/multicaixa-logo.png",
                color: "from-orange-500/10 to-orange-500/5",
                icon: "🏧"
              },
              {
                name: "Cartão (via Stripe)",
                description: "Pagamento seguro com cartão de crédito",
                logo: "/stripe-logo.png",
                color: "from-blue-500/10 to-blue-500/5",
                icon: "💳"
              }
            ].map((method, index) => (
              <motion.div
                key={index}
                className={`
                  p-4 rounded-2xl bg-gradient-to-r ${method.color} 
                  border border-muted/20 opacity-60 cursor-not-allowed
                  relative overflow-hidden
                `}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 0.6, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center p-2">
                      <img 
                        src={method.logo} 
                        alt={method.name}
                        className="w-full h-full object-contain"
                        loading="eager"
                        onError={(e) => {
                          console.error(`Erro ao carregar logo: ${method.name}`, e);
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMSA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDMgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjOTk5IiBzdHJva2U9IiM5OTkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                        }}
                      />
                    </div>
                    <div>
                      <h5 className="font-medium text-foreground/70">{method.name}</h5>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                    Em Breve
                  </Badge>
                </div>
                
                {/* Overlay para indicar indisponibilidade */}
                <div className="absolute inset-0 bg-muted/10 backdrop-blur-[1px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <span className="text-sm font-medium text-muted-foreground bg-background/80 px-3 py-1 rounded-full">
                    Disponível em breve
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              💡 Novos métodos de pagamento serão adicionados em breve para sua comodidade
            </p>
          </div>
        </motion.div>

        {/* Confirm Button */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button
            onClick={onConfirmOrder}
            disabled={isProcessing}
            className="w-full button-futuristic text-lg py-6 group"
            size="lg"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Confirmar Pedido
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            )}
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
        </motion.div>
      </CardContent>
    </Card>
  );
};