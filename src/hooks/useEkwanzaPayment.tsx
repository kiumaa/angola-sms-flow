import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PaymentMethod = 'qrcode' | 'mcx' | 'referencia';

export interface CreatePaymentParams {
  package_id: string;
  payment_method: PaymentMethod;
  mobile_number?: string;
}

export interface PaymentResponse {
  success: boolean;
  payment_id: string;
  transaction_id: string;
  payment_method: PaymentMethod;
  amount: number;
  credits: number;
  ekwanza_code?: string;
  qr_code?: string;
  reference_number?: string;
  expiration_date?: string;
  reference_code: string;
}

export interface PaymentStatus {
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  ekwanza_code?: string;
  amount: number;
  expiration_date?: string;
  created_at: string;
  paid_at?: string;
}

export const useEkwanzaPayment = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const createPayment = async (params: CreatePaymentParams): Promise<PaymentResponse | null> => {
    setIsCreating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ekwanza-create-payment', {
        body: params
      });

      if (error) {
        console.error('Error creating É-kwanza payment:', error);
        
        // Enhanced error message for network/DNS issues
        let errorDescription = error.message || "Não foi possível criar o pagamento.";
        
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
          errorDescription = "Falha de conexão com o provedor É-kwanza. Por favor, tente novamente ou use outro método de pagamento.";
        }
        
        toast({
          title: "❌ Erro ao Criar Pagamento",
          description: errorDescription,
          variant: "destructive",
          duration: 6000,
        });
        return null;
      }

      if (!data.success) {
        // Map error codes to user-friendly messages
        let title = "❌ Erro ao Criar Pagamento";
        let description = data.message || "Não foi possível criar o pagamento.";
        
        if (data.error === 'RATE_LIMIT') {
          title = "⏳ Limite Atingido";
          description = data.message || "Limite de tentativas atingido. Aguarde 1 minuto e tente novamente.";
        } else if (data.error === 'ENDPOINT_NOT_FOUND') {
          title = "🚫 Rota de Referência Indisponível";
          description = "O endpoint de Referência EMIS não está disponível no momento. Tente Multicaixa Express ou Transferência Bancária como alternativa.";
          if (data.suggestion) {
            description += `\n\n💡 ${data.suggestion}`;
          }
        } else if (data.error === 'PROVIDER_ERROR') {
          title = "⚠️ Erro do Provedor";
          description = data.message || "O provedor É-kwanza retornou um erro. Tente outro método de pagamento.";
          if (data.details) {
            description += `\n\nDetalhes: ${data.details.substring(0, 100)}`;
          }
        } else if (data.error === 'NETWORK') {
          description = data.message || "Falha de conexão com o provedor.";
          if (data.suggestion) {
            description += `\n\n💡 ${data.suggestion}`;
          }
          description += "\n\nTente usar Transferência Bancária como alternativa.";
        } else if (data.suggestion) {
          description += `\n\n💡 ${data.suggestion}`;
        }
        
        toast({
          title,
          description,
          variant: "destructive",
          duration: 8000,
        });
        return null;
      }

      toast({
        title: "✅ Pagamento Criado!",
        description: "Instruções de pagamento geradas com sucesso.",
        duration: 4000,
      });

      return data as PaymentResponse;
    } catch (error) {
      console.error('Unexpected error creating payment:', error);
      toast({
        title: "❌ Erro Inesperado",
        description: "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
        duration: 5000,
      });
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const checkPaymentStatus = async (paymentId: string): Promise<PaymentStatus | null> => {
    setIsChecking(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ekwanza-check-status', {
        body: { payment_id: paymentId }
      });

      if (error) {
        console.error('Error checking payment status:', error);
        return null;
      }

      return data as PaymentStatus;
    } catch (error) {
      console.error('Unexpected error checking payment status:', error);
      return null;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    createPayment,
    checkPaymentStatus,
    isCreating,
    isChecking
  };
};
