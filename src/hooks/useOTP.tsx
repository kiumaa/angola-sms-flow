import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { OTPRequest, CreateOTPRequest, VerifyOTPRequest, OTPRequestModel } from "@/types/otp";

export const useOTP = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  /**
   * Create and send OTP request
   */
  const requestOTP = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      // Send OTP request to secure endpoint (no code generation on frontend)
      const { data: smsData, error: smsError } = await supabase.functions.invoke('send-otp', {
        body: {
          phone
        }
      });

      if (smsError) {
        console.error('Failed to send OTP request:', smsError);
        const errorMessage = smsError.message || 'Erro ao enviar código OTP';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      if (!smsData?.success) {
        const errorMessage = smsData?.error || 'Erro ao enviar código OTP';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      
      return { success: true };
    } catch (err) {
      const errorMessage = 'Erro ao solicitar OTP';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify OTP code and authenticate user
   */
  const verifyOTP = async (phone: string, code: string): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> => {
    setLoading(true);
    setError(null);

    try {
      // Verify OTP via secure endpoint
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-otp', {
        body: {
          phone,
          code
        }
      });

      if (verifyError) {
        console.error('Failed to verify OTP:', verifyError);
        const errorMessage = verifyError.message || 'Erro ao verificar código';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      if (!verifyData?.success) {
        const errorMessage = verifyData?.error || 'Código inválido ou expirado';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // If we get a magic link, we can use it to authenticate
      if (verifyData.magic_link) {
        // Redirect to magic link for authentication
        window.location.href = verifyData.magic_link;
        return { success: true, isNewUser: verifyData.is_new_user };
      }

      return { success: true, isNewUser: verifyData.is_new_user };
    } catch (err) {
      const errorMessage = 'Erro ao verificar OTP';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clean expired OTP requests (utility function)
   */
  const cleanExpiredOTPs = async (): Promise<{ success: boolean; deletedCount?: number }> => {
    try {
      const { data, error } = await supabase.rpc('clean_expired_otps');
      
      if (error) {
        return { success: false };
      }

      return { success: true, deletedCount: data };
    } catch (err) {
      return { success: false };
    }
  };

  /**
   * Clean expired OTP requests via admin function
   */
  const adminCleanExpiredOTPs = async (): Promise<{ success: boolean; deletedCount?: number; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-otps', {});
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: data?.success || false, 
        deletedCount: data?.deleted_count 
      };
    } catch (err) {
      return { success: false, error: 'Erro ao executar limpeza de OTPs' };
    }
  };

  return {
    loading,
    error,
    requestOTP,
    verifyOTP,
    cleanExpiredOTPs, // Keep for backward compatibility (uses RPC)
    adminCleanExpiredOTPs, // New secure admin function
    clearError: () => setError(null)
  };
};