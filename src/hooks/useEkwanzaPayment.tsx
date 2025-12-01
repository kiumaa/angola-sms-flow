import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

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
  qr_mime_type?: string;
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
        console.error('❌ Error creating É-kwanza payment:', {
          method: params.payment_method,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
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
        } 
        // QR Code Disabled
        else if (data.error === 'QR_CODE_DISABLED') {
          title = "🚫 QR Code Desabilitado";
          description = "QR Code está temporariamente desabilitado. Use MCX Express ou Referência EMIS como alternativa.";
          if (data.suggestion) {
            description += `\n\n💡 ${data.suggestion}`;
          }
        }
        // MCX Express Errors
        else if (data.error === 'MCX_ENDPOINT_NOT_FOUND') {
          title = "🚫 Endpoint MCX Não Encontrado";
          description = "O endpoint MCX Express não foi encontrado. Verifique a configuração da API.";
          if (data.suggestion) {
            description += `\n\n💡 ${data.suggestion}`;
          }
        } else if (data.error === 'MCX_CONFIG_MISSING') {
          title = "⚙️ Configuração Incompleta";
          description = "Configuração MCX Express incompleta. Verifique os secrets no Supabase.";
          if (data.suggestion) {
            description += `\n\n💡 ${data.suggestion}`;
          }
        } else if (data.error === 'MCX_OAUTH_FAILED') {
          title = "🔐 Erro de Autenticação";
          description = "Falha na autenticação OAuth2 para MCX Express. Verifique as credenciais.";
          if (data.suggestion) {
            description += `\n\n💡 ${data.suggestion}`;
          }
        } else if (data.error === 'MCX_NETWORK_ERROR' || data.error === 'MCX_TIMEOUT') {
          title = "🌐 Erro de Conexão";
          description = "Não foi possível conectar ao servidor É-kwanza (MCX Express).";
          if (data.suggestion) {
            description += `\n\n💡 ${data.suggestion}`;
          }
          description += "\n\nTente novamente em alguns instantes ou use Transferência Bancária como alternativa.";
        } else if (data.error === 'MCX_UNAUTHORIZED') {
          title = "🔒 Token Inválido";
          description = "Token OAuth2 inválido ou expirado. Verifique as credenciais.";
          if (data.suggestion) {
            description += `\n\n💡 ${data.suggestion}`;
          }
        } else if (data.error === 'MCX_BAD_REQUEST') {
          title = "⚠️ Requisição Inválida";
          description = "Os dados fornecidos são inválidos. Verifique o número de telefone e valor.";
          if (data.suggestion) {
            description += `\n\n💡 ${data.suggestion}`;
          }
        } else if (data.error === 'MCX_API_ERROR' || data.error === 'MCX_SERVER_ERROR') {
          title = "⚠️ Erro do Servidor";
          description = "O servidor É-kwanza retornou um erro. Tente novamente em alguns instantes.";
          if (data.details) {
            description += `\n\nDetalhes: ${data.details.substring(0, 100)}`;
          }
        } else if (data.error === 'INVALID_RESPONSE') {
          title = "⚠️ Resposta Inválida";
          description = "A resposta da API É-kwanza não contém os dados esperados.";
          if (data.suggestion) {
            description += `\n\n💡 ${data.suggestion}`;
          }
        } else if (data.error === 'DATABASE_ERROR') {
          title = "💾 Erro no Banco de Dados";
          description = "Erro ao salvar dados do pagamento. Tente novamente.";
          if (data.suggestion) {
            description += `\n\n💡 ${data.suggestion}`;
          }
        }
        // Referência EMIS Errors
        else if (data.error === 'ENDPOINT_NOT_FOUND' || data.error === 'REF_ENDPOINT_NOT_FOUND') {
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
        
        // Log technical details to console for evidence collection
        const technicalDetails = {
          payment_method: params.payment_method,
          error_code: data.error,
          message: data.message,
          technical_details: data.technical_details,
          timestamp: new Date().toISOString(),
          package_id: params.package_id
        };
        
        console.error('📊 TECHNICAL ERROR DETAILS FOR EKWANZA:', JSON.stringify(technicalDetails, null, 2));
        
        // Store in window for easy access
        (window as any).__lastEkwanzaError = technicalDetails;
        
        toast({
          title,
          description,
          variant: "destructive",
          duration: 8000,
          action: data.technical_details ? (
            <ToastAction 
              altText="Copiar detalhes técnicos"
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(technicalDetails, null, 2));
                toast({
                  title: "✅ Detalhes Técnicos Copiados",
                  description: "Cole em um arquivo de texto para enviar ao suporte.",
                  duration: 3000
                });
              }}
            >
              📋 Copiar Detalhes
            </ToastAction>
          ) : undefined
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
