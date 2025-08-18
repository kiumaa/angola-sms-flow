import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AdvancedBrandSettings {
  id?: string;
  site_title: string;
  site_tagline: string;
  // Light theme colors
  light_primary: string;
  light_secondary: string;
  light_bg: string;
  light_text: string;
  // Dark theme colors
  dark_primary: string;
  dark_secondary: string;
  dark_bg: string;
  dark_text: string;
  // Typography
  font_family: string;
  font_scale: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
  };
  // Media
  logo_light_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  og_image_url?: string;
  // SEO
  seo_title?: string;
  seo_description?: string;
  seo_canonical?: string;
  seo_twitter: string;
  // Advanced
  custom_css?: string;
  updated_at?: string;
}

const DEFAULT_SETTINGS: AdvancedBrandSettings = {
  site_title: 'SMS AO',
  site_tagline: 'Conectando empresas aos seus clientes através de SMS marketing eficiente e profissional',
  light_primary: '#1A1A1A',
  light_secondary: '#666666',
  light_bg: '#F5F6F8',
  light_text: '#1A1A1A',
  dark_primary: '#F5F6F8',
  dark_secondary: '#9CA3AF',
  dark_bg: '#0B0B0C',
  dark_text: '#ECECEC',
  font_family: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial',
  font_scale: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24
  },
  seo_twitter: '@smsao'
};

export const useAdvancedBrandSettings = () => {
  const [settings, setSettings] = useState<AdvancedBrandSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [previewSettings, setPreviewSettings] = useState<AdvancedBrandSettings | null>(null);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.functions.invoke('branding-api', {
        method: 'GET'
      });

      if (data?.data && Object.keys(data.data).length > 0) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.data });
      }
    } catch (error) {
      console.error('Error fetching brand settings:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar configurações de marca',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AdvancedBrandSettings>) => {
    try {
      const { data } = await supabase.functions.invoke('branding-api', {
        method: 'PUT',
        body: newSettings
      });

      if (data?.data) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.data });
        setPreviewSettings(null);
        applySettingsToDOM({ ...DEFAULT_SETTINGS, ...data.data });
        toast({
          title: 'Sucesso',
          description: 'Configurações salvas com sucesso',
        });
        return data.data;
      }
    } catch (error) {
      console.error('Error updating brand settings:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const uploadFile = async (file: File, type: 'logo_light' | 'logo_dark' | 'favicon' | 'og_image'): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const { data } = await supabase.functions.invoke('branding-api/upload', {
        method: 'POST',
        body: formData
      });

      if (data?.data?.url) {
        return data.data.url;
      }
      throw new Error('Upload failed');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao fazer upload do arquivo',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const previewChanges = (changes: Partial<AdvancedBrandSettings>) => {
    const previewData = { ...settings, ...changes };
    setPreviewSettings(previewData);
    applySettingsToDOM(previewData);
    
    // Auto-clear preview after 10 minutes
    setTimeout(() => {
      setPreviewSettings(null);
      applySettingsToDOM(settings);
    }, 10 * 60 * 1000);
  };

  const clearPreview = () => {
    setPreviewSettings(null);
    applySettingsToDOM(settings);
  };

  const applySettingsToDOM = (settingsToApply: AdvancedBrandSettings) => {
    const root = document.documentElement;
    const currentTheme = root.getAttribute('data-theme') || 'light';

    // Apply colors based on theme
    if (currentTheme === 'dark') {
      root.style.setProperty('--color-primary', settingsToApply.dark_primary);
      root.style.setProperty('--color-secondary', settingsToApply.dark_secondary);
      root.style.setProperty('--color-bg', settingsToApply.dark_bg);
      root.style.setProperty('--color-text', settingsToApply.dark_text);
      root.style.setProperty('--logo-url', settingsToApply.logo_dark_url ? `url('${settingsToApply.logo_dark_url}')` : 'none');
    } else {
      root.style.setProperty('--color-primary', settingsToApply.light_primary);
      root.style.setProperty('--color-secondary', settingsToApply.light_secondary);
      root.style.setProperty('--color-bg', settingsToApply.light_bg);
      root.style.setProperty('--color-text', settingsToApply.light_text);
      root.style.setProperty('--logo-url', settingsToApply.logo_light_url ? `url('${settingsToApply.logo_light_url}')` : 'none');
    }

    // Apply typography
    root.style.setProperty('--font-family', settingsToApply.font_family);
    
    // Apply font sizes
    if (settingsToApply.font_scale) {
      root.style.setProperty('--font-xs', `${settingsToApply.font_scale.xs}px`);
      root.style.setProperty('--font-sm', `${settingsToApply.font_scale.sm}px`);
      root.style.setProperty('--font-base', `${settingsToApply.font_scale.base}px`);
      root.style.setProperty('--font-lg', `${settingsToApply.font_scale.lg}px`);
      root.style.setProperty('--font-xl', `${settingsToApply.font_scale.xl}px`);
      root.style.setProperty('--font-2xl', `${settingsToApply.font_scale['2xl']}px`);
    }

    // Update document title
    if (settingsToApply.site_title) {
      document.title = settingsToApply.site_title;
    }

    // Update favicon
    if (settingsToApply.favicon_url) {
      updateFavicon(settingsToApply.favicon_url);
    }

    // Apply custom CSS
    if (settingsToApply.custom_css) {
      applyCustomCSS(settingsToApply.custom_css);
    }

    // Load Google Fonts if needed
    if (settingsToApply.font_family && settingsToApply.font_family.includes('Google:')) {
      loadGoogleFont(settingsToApply.font_family);
    }
  };

  const updateFavicon = (url: string) => {
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = url;
  };

  const applyCustomCSS = (css: string) => {
    let styleElement = document.querySelector('#custom-brand-css') as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'custom-brand-css';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = css;
  };

  const loadGoogleFont = (fontFamily: string) => {
    const fontName = fontFamily.replace('Google:', '').split(',')[0].trim();
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+').replace(/\+/g, '%20')}:wght@300;400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  };

  const resetToDefaults = async () => {
    try {
      await updateSettings(DEFAULT_SETTINGS);
      toast({
        title: 'Sucesso',
        description: 'Configurações restauradas para os padrões',
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  };

  // Listen to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('branding')
      .on('broadcast', { event: 'updated' }, (payload) => {
        if (payload && payload.payload) {
          setSettings({ ...DEFAULT_SETTINGS, ...payload.payload });
          if (!previewSettings) {
            applySettingsToDOM({ ...DEFAULT_SETTINGS, ...payload.payload });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [previewSettings]);

  // Apply settings on theme change
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const currentSettings = previewSettings || settings;
          applySettingsToDOM(currentSettings);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, [settings, previewSettings]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!loading) {
      applySettingsToDOM(previewSettings || settings);
    }
  }, [settings, loading]);

  return {
    settings: previewSettings || settings,
    loading,
    updateSettings,
    uploadFile,
    previewChanges,
    clearPreview,
    resetToDefaults,
    refetch: fetchSettings,
    isPreviewMode: !!previewSettings
  };
};