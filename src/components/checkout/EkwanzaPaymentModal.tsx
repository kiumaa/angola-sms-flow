import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, QrCode, Phone, CreditCard, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "motion/react";
import type { PaymentResponse } from "@/hooks/useEkwanzaPayment";

interface EkwanzaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: PaymentResponse | null;
  onStatusChange?: (status: 'pending' | 'paid' | 'expired') => void;
}

export const EkwanzaPaymentModal = ({ 
  isOpen, 
  onClose, 
  paymentData,
  onStatusChange 
}: EkwanzaPaymentModalProps) => {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!paymentData?.expiration_date) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiration = new Date(paymentData.expiration_date!).getTime();
      const distance = expiration - now;

      if (distance < 0) {
        setTimeLeft("Expirado");
        onStatusChange?.('expired');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [paymentData?.expiration_date, onStatusChange]);

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

  if (!paymentData) return null;

  const getInstructions = () => {
    switch (paymentData.payment_method) {
      case 'qrcode':
        return {
          title: "Pagamento via QR Code",
          icon: QrCode,
          steps: [
            "Abra o app Multicaixa Express no seu telemóvel",
            "Toque em 'Pagar com QR Code'",
            "Aponte a câmera para o código QR abaixo",
            "Confirme o valor e complete o pagamento"
          ],
          color: "from-blue-500/10 to-blue-500/5"
        };
      case 'mcx':
        return {
          title: "Multicaixa Express",
          icon: Phone,
          steps: [
            "Abra o app Multicaixa Express",
            "Selecione 'Pagamentos'",
            `Insira o código: ${paymentData.ekwanza_code}`,
            "Confirme o valor e complete o pagamento"
          ],
          color: "from-orange-500/10 to-orange-500/5"
        };
      case 'referencia':
        return {
          title: "Pagamento por Referência",
          icon: CreditCard,
          steps: [
            "Vá a qualquer Multicaixa ATM",
            "Selecione 'Pagamentos'",
            `Insira a referência: ${paymentData.reference_number}`,
            "Confirme o valor e complete o pagamento"
          ],
          color: "from-green-500/10 to-green-500/5"
        };
    }
  };

  const instructions = getInstructions();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-gradient-to-r ${instructions.color}`}>
                <instructions.icon className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>{instructions.title}</DialogTitle>
                <DialogDescription>
                  Complete o pagamento para ativar seus créditos
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Valor e Créditos */}
          <motion.div 
            className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Valor a Pagar</span>
              <span className="text-2xl font-bold gradient-text">
                {paymentData.amount.toLocaleString('pt-AO')} Kz
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Créditos</span>
              <Badge className="bg-green-500/20 text-green-400">
                +{paymentData.credits.toLocaleString()} créditos
              </Badge>
            </div>
          </motion.div>

          {/* QR Code (apenas para qrcode) */}
          {paymentData.payment_method === 'qrcode' && paymentData.qr_code && (
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="p-4 bg-white rounded-2xl shadow-glow">
                <img 
                  src={`data:image/png;base64,${paymentData.qr_code}`}
                  alt="QR Code de Pagamento"
                  className="w-64 h-64"
                />
              </div>
            </motion.div>
          )}

          {/* Código/Referência (para mcx e referencia) */}
          {paymentData.payment_method !== 'qrcode' && (
            <motion.div 
              className="p-4 rounded-2xl glass-card border-glass-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">
                    {paymentData.payment_method === 'mcx' ? 'Código MCX' : 'Referência EMIS'}
                  </span>
                  <span className="text-2xl font-mono font-bold">
                    {paymentData.payment_method === 'mcx' 
                      ? paymentData.ekwanza_code 
                      : paymentData.reference_number}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(
                    paymentData.payment_method === 'mcx' 
                      ? paymentData.ekwanza_code! 
                      : paymentData.reference_number!,
                    paymentData.payment_method === 'mcx' ? 'Código' : 'Referência'
                  )}
                  className="glass-card"
                >
                  {copiedField ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Tempo Restante */}
          {paymentData.expiration_date && (
            <motion.div 
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
              <span className="text-sm font-medium">
                Válido por: <span className="text-yellow-500">{timeLeft}</span>
              </span>
            </motion.div>
          )}

          {/* Instruções Passo a Passo */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              Como Pagar:
            </h4>
            {instructions.steps.map((step, index) => (
              <motion.div
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl glass-card border-glass-border"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <p className="text-sm flex-1">{step}</p>
              </motion.div>
            ))}
          </div>

          {/* Código de Referência Interno */}
          <motion.div 
            className="p-3 rounded-xl bg-muted/20 border border-muted/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block">
                  Código de Referência Interno
                </span>
                <span className="text-sm font-mono">
                  {paymentData.reference_code}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(paymentData.reference_code, 'Código de Referência')}
              >
                {copiedField === 'Código de Referência' ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </motion.div>

          {/* Aviso */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-400">
              ℹ️ Após o pagamento, seus créditos serão adicionados automaticamente em até 5 minutos.
              Você pode fechar esta janela e voltar mais tarde.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
