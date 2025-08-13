import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RegistrationSettings {
  otp_enabled: boolean;
  free_credits_new_user: number;
}

export const useRegistrationSettings = () => {
  const [settings, setSettings] = useState<RegistrationSettings>({
    otp_enabled: true,
    free_credits_new_user: 10
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['otp_enabled', 'free_credits_new_user']);

      if (error) {
        console.error('Erro ao buscar configurações do site:', error);
        return;
      }

      const settingsMap = data.reduce((acc, item) => {
        if (item.key === 'otp_enabled') {
          acc.otp_enabled = item.value === 'true';
        } else if (item.key === 'free_credits_new_user') {
          acc.free_credits_new_user = parseInt(item.value, 10);
        }
        return acc;
      }, {} as Partial<RegistrationSettings>);

      setSettings(prev => ({ ...prev, ...settingsMap }));
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof RegistrationSettings, value: string) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);

      if (error) {
        console.error('Erro ao atualizar configuração:', error);
        return { success: false, error };
      }

      await fetchSettings(); // Refresh settings
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, updateSetting, refetch: fetchSettings };
};