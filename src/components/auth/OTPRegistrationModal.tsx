import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { CheckCircle, Smartphone, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useOTPFlow } from "@/hooks/useOTPFlow";

interface OTPRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  registrationData?: any;
  onVerified?: () => void;
}

const OTPRegistrationModal = ({ open, onOpenChange, phone, registrationData, onVerified }: OTPRegistrationModalProps) => {
  const { toast } = useToast();
  
  const otpFlow = useOTPFlow({
    onSuccess: (result) => {
      toast({
        title: "Conta criada com sucesso!",
        description: "Seja bem-vindo à nossa plataforma!",
      });
      
      // Delay closing modal to show success state
      setTimeout(() => {
        onOpenChange(false);
        onVerified?.();
      }, 2000);
    },
    onError: (error) => {
      console.error('OTP Registration error:', error);
    },
    rateLimitMs: 30000 // 30 seconds between sends
  });

  // Send OTP when modal opens
  useEffect(() => {
    if (open && phone) {
      // Set phone in the flow and trigger send
      otpFlow.setPhone(phone);
      if (otpFlow.step === 'phone') {
        otpFlow.sendOTP(phone);
      }
    }
  }, [open, phone]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      otpFlow.cleanup();
    };
  }, []);

  const handleVerifyCode = async () => {
    const result = await otpFlow.verifyCode(registrationData);
    
    if (result.success) {
      toast({
        title: "Conta criada com sucesso!",
        description: "Seja bem-vindo à nossa plataforma!",
      });
      
      // Delay closing modal to show success state
      setTimeout(() => {
        onOpenChange(false);
        onVerified?.();
      }, 2000);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-primary shadow-glow">
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            {otpFlow.step === 'sending' ? 'Enviando Código' : 
             otpFlow.step === 'verify' ? 'Verificar Código' : 
             otpFlow.step === 'verified' ? 'Conta Criada!' : 'Verificação'}
          </DialogTitle>
          <DialogDescription>
            {otpFlow.step === 'sending' 
              ? 'Enviando código de verificação...'
              : otpFlow.step === 'verify'
              ? `Código enviado para ${phone}` 
              : otpFlow.step === 'verified'
              ? 'Sua conta foi criada com sucesso!' 
              : 'Verificando sua conta...'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {otpFlow.step === 'sending' ? (
            <div className="flex flex-col items-center space-y-4">
              <LoadingSpinner size="lg" className="border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground text-center">
                Enviando código de verificação para<br />
                <span className="font-medium">{phone}</span>
              </p>
            </div>
          ) : otpFlow.step === 'verify' ? (
            <>
              <div className="space-y-4 text-center">
                <div className="space-y-2">
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

                <p className="text-sm text-muted-foreground">
                  Digite o código de 6 dígitos enviado para seu telefone
                </p>
                
                {!otpFlow.canSendOTP && (
                  <div className="glass-card p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        Aguarde {otpFlow.remainingCooldown} segundos para reenviar
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleVerifyCode}
                  disabled={otpFlow.isVerifying || otpFlow.code.length !== 6}
                  className="w-full"
                >
                  {otpFlow.isVerifying ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" className="border-primary-foreground border-t-transparent" />
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
                  disabled={otpFlow.isVerifying || otpFlow.isSending || !otpFlow.canSendOTP}
                >
                  {otpFlow.isSending ? "Enviando..." : "Reenviar Código"}
                </Button>
              </div>
            </>
          ) : otpFlow.step === 'verified' ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-green-800">Conta criada!</h3>
                <p className="text-sm text-muted-foreground">
                  Sua conta foi verificada com sucesso
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPRegistrationModal;