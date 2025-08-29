import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useOTP = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  /**
   * Create and send OTP request using Supabase Phone Auth + Twilio Verify
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

      // Use Supabase native phone auth with Twilio Verify
      console.log('Sending OTP via Supabase Phone Auth for:', phone);
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone.trim(),
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) {
        console.error('Failed to send OTP via Supabase:', error);
        const errorMessage = error.message || 'Erro ao enviar código OTP';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
      
      console.log('OTP sent successfully via Supabase Phone Auth');
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
   * Verify OTP code using Supabase Phone Auth and create/update profile
   */
  const verifyOTP = async (phone: string, code: string, registrationData?: any): Promise<{ success: boolean; error?: string; isNewUser?: boolean; magicLink?: string }> => {
    setLoading(true);
    setError(null);

    try {
      // Verify OTP via Supabase Phone Auth
      console.log('Verifying OTP via Supabase Phone Auth for:', phone, 'with code:', code);
      
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token: code,
        type: 'sms'
      });

      if (error) {
        console.error('Failed to verify OTP via Supabase:', error);
        const errorMessage = error.message || 'Código inválido ou expirado';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      if (!data?.user) {
        const errorMessage = 'Falha na autenticação';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      console.log('OTP verified successfully via Supabase Phone Auth');

      // Check if user profile exists to determine if new user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, email')
        .eq('user_id', data.user.id)
        .single();

      const isNewUser = !profile && !!profileError;

      // If it's a new user or registration data provided, update profile
      if (isNewUser || registrationData) {
        const profileData: any = {
          user_id: data.user.id,
          phone: phone.trim(),
        };

        if (registrationData?.fullName) {
          profileData.full_name = registrationData.fullName;
        }
        if (registrationData?.company) {
          profileData.company_name = registrationData.company;
        }
        if (registrationData?.email) {
          profileData.email = registrationData.email;
        }

        if (isNewUser) {
          // Create new profile
          const { error: insertError } = await supabase
            .from('profiles')
            .insert(profileData);
          
          if (insertError) {
            console.error('Failed to create profile:', insertError);
          }
        } else {
          // Update existing profile
          const { error: updateError } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('user_id', data.user.id);
          
          if (updateError) {
            console.error('Failed to update profile:', updateError);
          }
        }
      }

      return { 
        success: true, 
        isNewUser: !!isNewUser
      };
    } catch (err) {
      console.error('OTP verification exception:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar OTP';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clean expired OTP requests (utility function) - Deprecated with Supabase Phone Auth
   */
  const cleanExpiredOTPs = async (): Promise<{ success: boolean; deletedCount?: number }> => {
    // With Supabase Phone Auth + Twilio Verify, cleanup is handled automatically
    console.log('Cleanup handled automatically by Supabase Phone Auth');
    return { success: true, deletedCount: 0 };
  };

  /**
   * Clean expired OTP requests via admin function - Deprecated with Supabase Phone Auth
   */
  const adminCleanExpiredOTPs = async (): Promise<{ success: boolean; deletedCount?: number; error?: string }> => {
    // With Supabase Phone Auth + Twilio Verify, cleanup is handled automatically
    console.log('Cleanup handled automatically by Supabase Phone Auth');
    return { success: true, deletedCount: 0 };
  };

  return {
    loading,
    error,
    requestOTP,
    verifyOTP,
    cleanExpiredOTPs, // Keep for backward compatibility - now handled by Supabase
    adminCleanExpiredOTPs, // Keep for backward compatibility - now handled by Supabase
    clearError: () => setError(null)
  };
};