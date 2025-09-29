import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useOTP = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  /**
   * Create and send OTP request using custom edge function
   */
  const requestOTP = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      // Client-side phone validation - support international numbers
      const phoneRegex = /^\+\d{8,15}$/;
      if (!phoneRegex.test(phone)) {
        throw new Error('Formato de telefone inválido. Use +[código do país][número]');
      }

      // Use custom send-otp edge function
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phone: phone.trim() }
      });

      if (error) {
        console.error('Failed to send OTP via edge function:', error);
        const errorMessage = error.message || 'Erro ao enviar código OTP';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      if (data?.error) {
        console.error('Edge function returned error:', data.error);
        setError(data.error);
        return { success: false, error: data.error };
      }
      
      // OTP sent successfully
      return { success: true };
    } catch (err) {
      console.error('OTP request exception:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao solicitar OTP';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify OTP code using custom edge function
   */
  const verifyOTP = async (phone: string, code: string, registrationData?: any): Promise<{ success: boolean; error?: string; isNewUser?: boolean; magicLink?: string }> => {
    setLoading(true);
    setError(null);

    try {
      // Verify OTP via custom edge function
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { 
          phone: phone.trim(),
          code: code.trim(),
          ...registrationData
        }
      });

      if (error) {
        console.error('Failed to verify OTP via edge function:', error);
        const errorMessage = error.message || 'Código inválido ou expirado';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      if (data?.error) {
        console.error('Edge function returned error:', data.error);
        setError(data.error);
        return { success: false, error: data.error };
      }

      if (!data?.success) {
        const errorMessage = 'Falha na verificação do código';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // OTP verified successfully
      return { 
        success: true, 
        isNewUser: data.isNewUser,
        magicLink: data.redirectUrl 
      };
    } catch (err) {
      console.error('OTP verification exception:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar código';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clean expired OTP requests (utility function) - Deprecated
   */
  const cleanExpiredOTPs = async (): Promise<{ success: boolean; deletedCount?: number }> => {
    // Cleanup handled automatically by edge functions
    return { success: true, deletedCount: 0 };
  };

  /**
   * Clean expired OTP requests via admin function - Deprecated
   */
  const adminCleanExpiredOTPs = async (): Promise<{ success: boolean; deletedCount?: number; error?: string }> => {
    // Cleanup handled automatically by edge functions
    return { success: true, deletedCount: 0 };
  };

  return {
    loading,
    error,
    requestOTP,
    verifyOTP,
    cleanExpiredOTPs, // Keep for backward compatibility
    adminCleanExpiredOTPs, // Keep for backward compatibility
    clearError: () => setError(null)
  };
};