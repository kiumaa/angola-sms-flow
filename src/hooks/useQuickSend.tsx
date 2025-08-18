import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface QuickSendRequest {
  message: string;
  recipients: string[];
  senderId?: string;
}

interface QuickSendResponse {
  success: boolean;
  jobId?: string;
  validRecipients?: number;
  invalidRecipients?: number;
  creditsEstimated?: number;
  segmentInfo?: {
    encoding: string;
    segments: number;
    charactersUsed: number;
    maxCharacters: number;
    isValid: boolean;
  };
  invalidDetails?: Array<{
    phone: string;
    reason: string;
  }>;
  error?: string;
}

interface JobStatus {
  job: {
    id: string;
    status: string;
    message: string;
    sender_id: string;
    total_recipients: number;
    credits_estimated: number;
    credits_spent: number;
    created_at: string;
    completed_at?: string;
  };
  stats: {
    queued: number;
    sending: number;
    sent: number;
    delivered: number;
    failed: number;
  };
  recentTargets: Array<{
    id: string;
    phone_e164: string;
    status: string;
    error_code?: string;
    error_detail?: string;
    sent_at?: string;
    delivered_at?: string;
  }>;
}

export const useQuickSend = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const sendQuickSMS = async (request: QuickSendRequest): Promise<QuickSendResponse> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('quick-send', {
        body: request
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Quick send failed');
      }

      toast({
        title: "SMS Enviado",
        description: `${data.validRecipients} mensagens foram enfileiradas para envio.`,
      });

      return data;
    } catch (error) {
      console.error('Quick send error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar SMS';
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });

      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getJobStatus = async (jobId: string): Promise<JobStatus> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke(`quick-send-status/${jobId}`, {
      method: 'GET'
    });

    if (error) {
      throw error;
    }

    if (!data.success) {
      throw new Error(data.error || 'Failed to get job status');
    }

    return data;
  };

  return {
    sendQuickSMS,
    getJobStatus,
    loading
  };
};