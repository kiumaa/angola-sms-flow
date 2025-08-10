import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Smartphone, ArrowLeft, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOTP } from "@/hooks/useOTP";
import { PhoneInput } from "@/components/shared/PhoneInput";

interface OTPLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OTPLoginModal = ({ open, onOpenChange }: OTPLoginModalProps) => {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isRequestingOTP, setIsRequestingOTP] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const { requestOTP, verifyOTP } = useOTP();

  const handleRequestOTP = async () => {
    if (!phone) {
      toast({
        title: "Número obrigatório",
        description: "Digite um número de telefone válido",
        variant: "destructive",
      });
      return;
    }

    setIsRequestingOTP(true);
    try {
      const result = await requestOTP(phone);
      
      if (result.success) {
        setStep('code');
        toast({
          title: "Código enviado!",
          description: `Enviamos um código para ${phone}`,
        });
      } else {
        toast({
          title: "Erro ao enviar código",
          description: result.error || "Tente novamente em alguns minutos",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Não foi possível enviar o código",
        variant: "destructive",
      });
    } finally {
      setIsRequestingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (code.length !== 6) {
      toast({
        title: "Código incompleto",
        description: "Digite o código de 6 dígitos",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const result = await verifyOTP(phone, code);
      
      if (result.success) {
        toast({
          title: "Login realizado!",
          description: "Acesso autorizado via SMS",
        });
        onOpenChange(false);
        // Aqui você integraria com o sistema de auth para criar a sessão
      } else {
        toast({
          title: "Código inválido",
          description: result.error || "Verifique o código e tente novamente",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na verificação",
        description: "Não foi possível verificar o código",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBack = () => {
    if (step === 'code') {
      setStep('phone');
      setCode("");
    } else {
      onOpenChange(false);
    }
  };

  const resetModal = () => {
    setStep('phone');
    setPhone("");
    setCode("");
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
            {step === 'phone' ? 'Login com Telefone' : 'Verificar Código'}
          </DialogTitle>
          <DialogDescription>
            {step === 'phone' 
              ? 'Receba um código de acesso por SMS' 
              : `Código enviado para ${phone}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 'phone' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Número de Telefone</Label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  placeholder="9XX XXX XXX"
                  className="h-12"
                />
              </div>

              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Seguro e Rápido</p>
                    <p className="text-xs text-muted-foreground">
                      Código válido por 5 minutos • Apenas números angolanos
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button
                  onClick={handleRequestOTP}
                  disabled={isRequestingOTP || !phone}
                  className="flex-1"
                >
                  {isRequestingOTP ? "Enviando..." : "Enviar Código"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4 text-center">
                <div className="space-y-2">
                  <Label>Código de Verificação</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      value={code}
                      onChange={setCode}
                      maxLength={6}
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
                  Não recebeu o código?{" "}
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="text-primary hover:underline"
                  >
                    Tentar novamente
                  </button>
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Alterar
                </Button>
                <Button
                  onClick={handleVerifyOTP}
                  disabled={isVerifying || code.length !== 6}
                  className="flex-1"
                >
                  {isVerifying ? "Verificando..." : "Entrar"}
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