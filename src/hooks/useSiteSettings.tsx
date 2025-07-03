import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SiteSettings {
  site_title: string;
  site_subtitle: string;
}

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    site_title: "SMS Marketing Angola",
    site_subtitle: "Conectando empresas aos seus clientes através de SMS marketing eficiente e profissional"
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('brand_settings')
        .select('site_title, site_subtitle')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setSettings({
          site_title: data.site_title || "SMS Marketing Angola",
          site_subtitle: data.site_subtitle || "Conectando empresas aos seus clientes através de SMS marketing eficiente e profissional"
        });
      }
    } catch (error: any) {
      console.error('Error fetching site settings:', error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    refetch: fetchSettings
  };
};
