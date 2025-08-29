import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Smartphone, ArrowLeft, Shield, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOTP } from "@/hooks/useOTP";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

interface OTPRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  registrationData?: any;
  onVerified: () => void;
}

const OTPRegistrationModal = ({ open, onOpenChange, phone, registrationData, onVerified }: OTPRegistrationModalProps) => {
  const [step, setStep] = useState<'sending' | 'verify' | 'verified'>('sending');
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { requestOTP, verifyOTP } = useOTP();

  // Send OTP when modal opens (prevent duplicate calls)
  useEffect(() => {
    if (open && phone && !isSending && step === 'sending') {
      handleSendOTP();
    }
  }, [open, phone]);

  const handleSendOTP = async () => {
    if (isSending) return; // Prevent duplicate calls
    
    setIsSending(true);
    setStep('sending');
    
    try {
      const result = await requestOTP(phone);
      
      if (result.success) {
        setStep('verify');
        toast({
          title: "Código enviado! 📱",
          description: `Enviamos um código de verificação para ${phone}`,
        });
      } else {
        toast({
          title: "Erro ao enviar código",
          description: result.error || "Não foi possível enviar o código SMS",
          variant: "destructive",
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Erro ao enviar OTP:", error);
      toast({
        title: "Erro de conexão",
        description: "Verifique sua internet e tente novamente",
        variant: "destructive",
      });
      onOpenChange(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      toast({
        title: "Código inválido",
        description: "O código deve ter 6 dígitos",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const result = await verifyOTP(phone, code, registrationData);
      
      if (result.success) {
        setStep('verified');
        toast({
          title: "Conta criada com sucesso! 🎉",
          description: `Bem-vindo à plataforma SMS.AO. Você ganhou 5 SMS grátis!`,
        });
        
        // Redirect to dashboard using magic link or direct navigation
        setTimeout(() => {
          if (result.magicLink) {
            window.location.href = result.magicLink;
          } else {
            window.location.href = '/dashboard';
          }
        }, 1500);
      } else {
        toast({
          title: "Código incorreto",
          description: result.error || "Verifique o código e tente novamente",
          variant: "destructive",
        });
        setCode("");
      }
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      toast({
        title: "Erro na verificação",
        description: "Tente novamente em alguns segundos",
        variant: "destructive",
      });
      setCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = () => {
    if (isSending) return; // Prevent spam clicking
    setCode("");
    handleSendOTP();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-primary shadow-glow">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Verificação de Telefone</DialogTitle>
              <DialogDescription className="mt-1">
                Confirme seu número para continuar
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'sending' && (
            <div className="text-center py-8">
              <LoadingSpinner />
              <p className="mt-4 text-muted-foreground">Enviando código SMS...</p>
            </div>
          )}

          {step === 'verify' && (
            <>
              <div className="text-center">
                <p className="text-muted-foreground">
                  Digite o código de 6 dígitos enviado para:
                </p>
                <p className="font-semibold mt-1 text-lg">{phone}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Verifique sua caixa de SMS
                </p>
              </div>

              <div className="space-y-4">
                <Label htmlFor="otp-code" className="text-center block">
                  Código de Verificação
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    value={code}
                    onChange={(value) => setCode(value)}
                    maxLength={6}
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleVerifyCode}
                  disabled={isVerifying || code.length !== 6}
                  className="w-full"
                >
                  {isVerifying ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                      <span>Verificando...</span>
                    </div>
                  ) : (
                    "Verificar Código"
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleResendCode}
                  className="w-full"
                  disabled={isVerifying || isSending}
                >
                  {isSending ? "Enviando..." : "Reenviar Código"}
                </Button>
              </div>
            </>
          )}

          {step === 'verified' && (
            <div className="text-center py-8">
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20 w-fit mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                Telefone Verificado!
              </h3>
              <p className="text-muted-foreground mt-2">
                Prosseguindo com o cadastro...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPRegistrationModal;