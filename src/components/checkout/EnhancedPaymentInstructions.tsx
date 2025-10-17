import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Building2,
  Smartphone,
  Hash
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import multicaixaExpressLogo from "@/assets/multicaixa-express-logo.png";
import multicaixaLogo from "@/assets/multicaixa-logo.png";

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
  onEkwanzaPayment?: (method: 'qrcode' | 'mcx' | 'referencia', mobileNumber?: string) => void;
  selectedPaymentMethod?: 'qrcode' | 'mcx' | 'referencia' | 'bank_transfer' | null;
  onPaymentMethodChange?: (method: 'qrcode' | 'mcx' | 'referencia' | 'bank_transfer') => void;
}

export const EnhancedPaymentInstructions = ({ 
  bankDetails, 
  amount, 
  isProcessing, 
  onConfirmOrder,
  onEkwanzaPayment,
  selectedPaymentMethod,
  onPaymentMethodChange
}: EnhancedPaymentInstructionsProps) => {
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileError, setMobileError] = useState('');

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

  const validatePhone = (phone: string) => {
    // Remove espaços e validação para formato angolano 9XX XXX XXX
    const cleaned = phone.replace(/\s/g, '');
    
    if (!cleaned) {
      setMobileError('');
      return false;
    }
    
    if (!/^9\d{8}$/.test(cleaned)) {
      setMobileError('Formato inválido. Use: 9XX XXX XXX');
      return false;
    }
    
    setMobileError('');
    return true;
  };

  const handleConfirmPayment = () => {
    if (!selectedPaymentMethod) return;
    
    if (selectedPaymentMethod === 'bank_transfer') {
      onConfirmOrder();
      return;
    }
    
    // Validar telefone para QR Code e MCX
    if ((selectedPaymentMethod === 'qrcode' || selectedPaymentMethod === 'mcx') && !mobileNumber) {
      setMobileError('Número de telefone é obrigatório');
      return;
    }
    
    if ((selectedPaymentMethod === 'qrcode' || selectedPaymentMethod === 'mcx') && !validatePhone(mobileNumber)) {
      return;
    }
    
    if (onEkwanzaPayment) {
      onEkwanzaPayment(selectedPaymentMethod, mobileNumber || undefined);
    }
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
        <div className="space-y-4">
          <h4 className="font-medium">Escolha o Método de Pagamento</h4>
          
          <div className="space-y-3">
            {/* Transferência Bancária */}
            <motion.button
              onClick={() => onPaymentMethodChange?.('bank_transfer')}
              className={cn(
                "w-full p-4 rounded-2xl border-2 transition-all duration-300 text-left",
                selectedPaymentMethod === 'bank_transfer'
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-muted/20 hover:border-primary/50"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-primary">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h5 className="font-medium">Transferência Bancária</h5>
                  <p className="text-sm text-muted-foreground">
                    Transferência tradicional via banco
                  </p>
                </div>
              </div>
                
                {selectedPaymentMethod === 'bank_transfer' && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            </motion.button>

            {/* QR Code É-kwanza */}
            <motion.button
              onClick={() => onPaymentMethodChange?.('qrcode')}
              className={cn(
                "w-full p-4 rounded-2xl border-2 transition-all duration-300 text-left",
                selectedPaymentMethod === 'qrcode'
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-muted/20 hover:border-primary/50"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-primary">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h5 className="font-medium">QR Code É-kwanza</h5>
                  <p className="text-sm text-muted-foreground">
                    Escaneie e pague pelo app Multicaixa
                  </p>
                </div>
              </div>
                
                {selectedPaymentMethod === 'qrcode' && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            </motion.button>

            {/* Multicaixa Express */}
            <motion.button
              onClick={() => onPaymentMethodChange?.('mcx')}
              className={cn(
                "w-full p-4 rounded-2xl border-2 transition-all duration-300 text-left",
                selectedPaymentMethod === 'mcx'
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-muted/20 hover:border-primary/50"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/95 dark:bg-white">
                  <img 
                    src={multicaixaExpressLogo} 
                    alt="Multicaixa Express"
                    className="h-10 w-10 object-contain"
                  />
                </div>
                <div>
                  <h5 className="font-medium">Multicaixa Express</h5>
                  <p className="text-sm text-muted-foreground">
                    Pagamento via Multicaixa Express
                  </p>
                </div>
              </div>
                
                {selectedPaymentMethod === 'mcx' && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            </motion.button>

            {/* Referência EMIS */}
            <motion.button
              onClick={() => onPaymentMethodChange?.('referencia')}
              className={cn(
                "w-full p-4 rounded-2xl border-2 transition-all duration-300 text-left",
                selectedPaymentMethod === 'referencia'
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-muted/20 hover:border-primary/50"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-primary">
                    <Hash className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h5 className="font-medium">Referência EMIS</h5>
                    <p className="text-sm text-muted-foreground">
                      Gere uma referência para pagamento
                    </p>
                  </div>
                </div>
                
                {selectedPaymentMethod === 'referencia' && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            </motion.button>
          </div>
        </div>

        {/* Mobile Number Input (for QR Code and MCX) */}
        <AnimatePresence>
          {(selectedPaymentMethod === 'qrcode' || selectedPaymentMethod === 'mcx') && (
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Label htmlFor="mobile">Número de Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="9XX XXX XXX"
                  value={mobileNumber}
                  onChange={(e) => {
                    setMobileNumber(e.target.value);
                    validatePhone(e.target.value);
                  }}
                  className={cn(
                    "pl-10",
                    mobileError && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
              </div>
              {mobileError && (
                <p className="text-xs text-red-500">{mobileError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Digite o número do telefone associado ao Multicaixa Express
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bank Details Section (only for bank_transfer) */}
        {selectedPaymentMethod === 'bank_transfer' && (
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
                        {step.detail}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
        )}

        {/* Confirm Button */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button
            onClick={handleConfirmPayment}
            disabled={isProcessing || !selectedPaymentMethod}
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
                {selectedPaymentMethod === 'bank_transfer' ? 'Confirmar Pedido' : 'Gerar Pagamento É-kwanza'}
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