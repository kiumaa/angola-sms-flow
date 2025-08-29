import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Smartphone, ArrowLeft, Shield, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InternationalPhoneInput } from "@/components/shared/InternationalPhoneInput";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useOTPFlow } from "@/hooks/useOTPFlow";
import { DEFAULT_COUNTRY, type PhoneCountry } from "@/lib/internationalPhoneNormalization";

interface OTPLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OTPLoginModal = ({ open, onOpenChange }: OTPLoginModalProps) => {
  const { toast } = useToast();
  const [selectedCountry, setSelectedCountry] = useState<PhoneCountry>(DEFAULT_COUNTRY);
  
  const otpFlow = useOTPFlow({
    onSuccess: (result) => {
      toast({
        title: "Login realizado!",
        description: "Acesso autorizado via SMS",
      });
      onOpenChange(false);
      // TODO: Integrate with auth system to create session using result.magicLink
    },
    onError: (error) => {
      console.error('OTP Login error:', error);
    },
    rateLimitMs: 30000 // 30 seconds between sends
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      otpFlow.cleanup();
    };
  }, []);

  const handleRequestOTP = () => {
    if (!otpFlow.canSendOTP) {
      toast({
        title: "Aguarde um pouco",
        description: `Aguarde ${otpFlow.remainingCooldown} segundos`,
        variant: "destructive",
      });
      return;
    }
    otpFlow.sendOTP();
  };

  const handleVerifyOTP = () => {
    otpFlow.verifyCode();
  };

  const handleBack = () => {
    if (otpFlow.step === 'verify' || otpFlow.step === 'sending') {
      otpFlow.goBack();
    } else {
      onOpenChange(false);
    }
  };

  const handleResendCode = () => {
    if (!otpFlow.canSendOTP) {
      toast({
        title: "Aguarde um pouco",
        description: `Aguarde ${otpFlow.remainingCooldown} segundos`,
        variant: "destructive",
      });
      return;
    }
    otpFlow.resendOTP();
  };

  const resetModal = () => {
    otpFlow.reset();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetModal();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-primary shadow-glow">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            {otpFlow.step === 'phone' ? 'Login com Telefone' : 
             otpFlow.step === 'sending' ? 'Enviando Código' : 'Verificar Código'}
          </DialogTitle>
          <DialogDescription>
            {otpFlow.step === 'phone' 
              ? 'Receba um código de acesso por SMS' 
              : otpFlow.step === 'sending'
              ? 'Enviando código de verificação...'
              : `Código enviado para ${otpFlow.phone}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {otpFlow.step === 'phone' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Número de Telefone</Label>
                  <InternationalPhoneInput
                    value={otpFlow.phone}
                    onChange={otpFlow.setPhone}
                    country={selectedCountry}
                    onCountryChange={setSelectedCountry}
                    showValidation={true}
                    autoDetectCountry={true}
                    className="h-12"
                    disabled={otpFlow.isSending}
                  />
                </div>

                <div className="glass-card p-4 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Seguro e Rápido</p>
                      <p className="text-xs text-muted-foreground">
                        Código válido por 5 minutos • Suporte internacional
                      </p>
                    </div>
                  </div>
                </div>

                {!otpFlow.canSendOTP && (
                  <div className="glass-card p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        Aguarde {otpFlow.remainingCooldown} segundos para enviar novamente
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                    disabled={otpFlow.isSending}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                  <Button
                    onClick={handleRequestOTP}
                    disabled={otpFlow.isSending || !otpFlow.phone || !otpFlow.canSendOTP}
                    className="flex-1"
                  >
                    {otpFlow.isSending ? (
                      <div className="flex items-center space-x-2">
                        <LoadingSpinner size="sm" className="border-primary-foreground border-t-transparent" />
                        <span>Enviando...</span>
                      </div>
                    ) : (
                      "Enviar Código"
                    )}
                  </Button>
                </div>
              </>
          ) : otpFlow.step === 'sending' ? (
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center space-y-4">
                <LoadingSpinner size="lg" className="border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">
                  Enviando código de verificação...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4 text-center">
                <div className="space-y-2">
                  <Label>Código de Verificação</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      value={otpFlow.code}
                      onChange={otpFlow.setCode}
                      maxLength={6}
                      disabled={otpFlow.isVerifying}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Não recebeu o código?{" "}
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={otpFlow.isSending || !otpFlow.canSendOTP}
                      className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {otpFlow.isSending ? "Enviando..." : "Reenviar código"}
                    </button>
                  </p>
                  
                  {!otpFlow.canSendOTP && (
                    <p className="text-xs text-amber-600">
                      Aguarde {otpFlow.remainingCooldown}s para reenviar
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={otpFlow.isVerifying}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Alterar
                </Button>
                <Button
                  onClick={handleVerifyOTP}
                  disabled={otpFlow.isVerifying || otpFlow.code.length !== 6}
                  className="flex-1"
                >
                  {otpFlow.isVerifying ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" className="border-primary-foreground border-t-transparent" />
                      <span>Verificando...</span>
                    </div>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPLoginModal;