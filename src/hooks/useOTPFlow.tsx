import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOTP } from "@/hooks/useOTP";

interface UseOTPFlowConfig {
  onSuccess?: (result: { success: boolean; isNewUser?: boolean; magicLink?: string }) => void;
  onError?: (error: string) => void;
  rateLimitMs?: number;
}

export const useOTPFlow = (config: UseOTPFlowConfig = {}) => {
  const [step, setStep] = useState<'phone' | 'sending' | 'verify' | 'verified'>('phone');
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastSendTime, setLastSendTime] = useState<number>(0);
  
  const { toast } = useToast();
  const { requestOTP, verifyOTP } = useOTP();
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Rate limiting configuration
  const rateLimitMs = config.rateLimitMs || 30000; // 30 seconds default

  const canSendOTP = useCallback(() => {
    const now = Date.now();
    const timeSinceLastSend = now - lastSendTime;
    return timeSinceLastSend >= rateLimitMs;
  }, [lastSendTime, rateLimitMs]);

  const getRemainingCooldown = useCallback(() => {
    const now = Date.now();
    const timeSinceLastSend = now - lastSendTime;
    const remaining = Math.max(0, rateLimitMs - timeSinceLastSend);
    return Math.ceil(remaining / 1000); // Return in seconds
  }, [lastSendTime, rateLimitMs]);

  // Debounced send OTP function
  const sendOTP = useCallback(async (phoneNumber?: string) => {
    const targetPhone = phoneNumber || phone;
    
    if (!targetPhone) {
      toast({
        title: "Número obrigatório",
        description: "Digite um número de telefone válido",
        variant: "destructive",
      });
      return { success: false, error: "Número obrigatório" };
    }

    if (isSending) {
      // OTP send already in progress
      return { success: false, error: "Envio em progresso" };
    }

    if (!canSendOTP()) {
      const remainingSeconds = getRemainingCooldown();
      const errorMsg = `Aguarde ${remainingSeconds} segundos antes de tentar novamente`;
      toast({
        title: "Aguarde um pouco",
        description: errorMsg,
        variant: "destructive",
      });
      return { success: false, error: errorMsg };
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce to prevent rapid successive calls
    return new Promise((resolve) => {
      timeoutRef.current = setTimeout(async () => {
        setIsSending(true);
        setStep('sending');
        
        try {
          // Sending OTP via useOTPFlow
          const result = await requestOTP(targetPhone);
          
          if (result.success) {
            setLastSendTime(Date.now());
            setStep('verify');
            toast({
              title: "Código enviado!",
              description: `Enviamos um código para ${targetPhone}`,
            });
            resolve({ success: true });
          } else {
            setStep('phone');
            const errorMsg = result.error || "Erro ao enviar código OTP";
            toast({
              title: "Erro ao enviar código",
              description: errorMsg,
              variant: "destructive",
            });
            config.onError?.(errorMsg);
            resolve({ success: false, error: errorMsg });
          }
        } catch (error) {
          setStep('phone');
          const errorMsg = error instanceof Error ? error.message : 'Erro inesperado';
          toast({
            title: "Erro inesperado",
            description: errorMsg,
            variant: "destructive",
          });
          config.onError?.(errorMsg);
          resolve({ success: false, error: errorMsg });
        } finally {
          setIsSending(false);
        }
      }, 300); // 300ms debounce
    });
  }, [phone, isSending, canSendOTP, getRemainingCooldown, requestOTP, toast, config]);

  const verifyCode = useCallback(async (registrationData?: any) => {
    if (code.length !== 6) {
      toast({
        title: "Código incompleto",
        description: "Digite o código de 6 dígitos",
        variant: "destructive",
      });
      return { success: false, error: "Código incompleto" };
    }

    if (isVerifying) {
      // OTP verification already in progress
      return { success: false, error: "Verificação em progresso" };
    }

    setIsVerifying(true);
    
    try {
      // Verifying OTP via useOTPFlow
      const result = await verifyOTP(phone, code, registrationData);
      
      if (result.success) {
        setStep('verified');
        toast({
          title: "Código verificado!",
          description: "Acesso autorizado",
        });
        config.onSuccess?.(result);
        return result;
      } else {
        const errorMsg = result.error || "Código inválido ou expirado";
        toast({
          title: "Código inválido",
          description: errorMsg,
          variant: "destructive",
        });
        config.onError?.(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro na verificação';
      toast({
        title: "Erro na verificação",
        description: errorMsg,
        variant: "destructive",
      });
      config.onError?.(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsVerifying(false);
    }
  }, [phone, code, isVerifying, verifyOTP, toast, config]);

  const resendOTP = useCallback(() => {
    if (isSending) return;
    setCode("");
    return sendOTP();
  }, [sendOTP, isSending]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setStep('phone');
    setPhone("");
    setCode("");
    setIsSending(false);
    setIsVerifying(false);
  }, []);

  const goBack = useCallback(() => {
    if (step === 'verify' || step === 'sending') {
      setStep('phone');
      setCode("");
    }
  }, [step]);

  // Cleanup timeout on unmount
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    // State
    step,
    phone,
    code,
    isSending,
    isVerifying,
    
    // Computed
    canSendOTP: canSendOTP(),
    remainingCooldown: getRemainingCooldown(),
    
    // Actions
    setPhone,
    setCode,
    sendOTP,
    verifyCode,
    resendOTP,
    reset,
    goBack,
    cleanup
  };
};