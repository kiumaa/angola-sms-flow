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
      // Create OTP request payload
      const otpPayload = OTPRequestModel.createRequestPayload(phone, user?.id);

      // Insert OTP request into database
      const { data, error: dbError } = await supabase
        .from('otp_requests')
        .insert(otpPayload)
        .select()
        .single();

      if (dbError) {
        setError('Erro ao criar solicitação OTP');
        return { success: false, error: dbError.message };
      }

      // TODO: Integrate with SMS service to send OTP
      console.log('OTP Code to send:', otpPayload.code, 'to phone:', phone);
      
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
   * Verify OTP code
   */
  const verifyOTP = async (phone: string, code: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      // Find valid OTP request
      const { data: otpRequest, error: fetchError } = await supabase
        .from('otp_requests')
        .select('*')
        .eq('phone', phone)
        .eq('code', code)
        .eq('used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        setError('Erro ao verificar OTP');
        return { success: false, error: fetchError.message };
      }

      if (!otpRequest) {
        setError('Código OTP inválido ou expirado');
        return { success: false, error: 'Código inválido' };
      }

      // Check if OTP is still valid
      if (!OTPRequestModel.isValid(otpRequest)) {
        setError('Código OTP expirado');
        return { success: false, error: 'Código expirado' };
      }

      // Mark OTP as used
      const { error: updateError } = await supabase
        .from('otp_requests')
        .update({ used: true })
        .eq('id', otpRequest.id);

      if (updateError) {
        setError('Erro ao validar OTP');
        return { success: false, error: updateError.message };
      }

      return { success: true };
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
   * Get OTP requests for current user (admin use)
   */
  const getUserOTPRequests = async (userId?: string): Promise<{ data: OTPRequest[] | null; error?: string }> => {
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        return { data: null, error: 'Usuário não autenticado' };
      }

      const { data, error } = await supabase
        .from('otp_requests')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data };
    } catch (err) {
      return { data: null, error: 'Erro ao buscar solicitações OTP' };
    }
  };

  return {
    loading,
    error,
    requestOTP,
    verifyOTP,
    cleanExpiredOTPs,
    getUserOTPRequests,
    clearError: () => setError(null)
  };
};