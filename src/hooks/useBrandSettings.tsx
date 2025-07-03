import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BrandSettings {
  id: string;
  primary_color: string;
  secondary_color: string;
  logo_url?: string;
  favicon_url?: string;
}

export const useBrandSettings = () => {
  const [settings, setSettings] = useState<BrandSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('brand_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setSettings(data);
    } catch (error: any) {
      console.error('Error fetching brand settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<BrandSettings>) => {
    try {
      const { data, error } = await supabase
        .from('brand_settings')
        .update(newSettings)
        .eq('id', settings?.id)
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      applyBrandSettings(data);
      
      toast({
        title: "Configurações atualizadas",
        description: "As alterações foram aplicadas com sucesso.",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error updating brand settings:', error);
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const uploadFile = async (file: File, type: 'logo' | 'favicon') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}.${fileExt}`;
      const filePath = `${Date.now()}-${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const applyBrandSettings = (brandSettings: BrandSettings) => {
    const root = document.documentElement;
    
    // Parse HSL values and apply to CSS custom properties
    const parsePrimaryColor = brandSettings.primary_color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    const parseSecondaryColor = brandSettings.secondary_color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    
    if (parsePrimaryColor) {
      root.style.setProperty('--primary', `${parsePrimaryColor[1]} ${parsePrimaryColor[2]}% ${parsePrimaryColor[3]}%`);
    }
    
    if (parseSecondaryColor) {
      root.style.setProperty('--secondary', `${parseSecondaryColor[1]} ${parseSecondaryColor[2]}% ${parseSecondaryColor[3]}%`);
    }

    // Update favicon if set
    if (brandSettings.favicon_url) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = brandSettings.favicon_url;
      }
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      applyBrandSettings(settings);
    }
  }, [settings]);

  return {
    settings,
    loading,
    updateSettings,
    uploadFile,
    refetch: fetchSettings
  };
};