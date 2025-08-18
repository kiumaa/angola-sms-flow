import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteSettings {
  site_title?: string;
  site_subtitle?: string;
}

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      // Get from brand_settings table since that's where site_title is stored
      const { data, error } = await supabase
        .from('brand_settings')
        .select('site_title, site_tagline')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar configurações do site:', error);
        return;
      }

      if (data) {
        setSettings({
          site_title: data.site_title,
          site_subtitle: data.site_tagline
        });
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, refetch: fetchSettings };
};