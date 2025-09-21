import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BrandSettings {
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
  font_scale: any;
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
  robots_index?: boolean;
  robots_follow?: boolean;
  // Legacy compatibility
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  font_sizes?: any;
  site_subtitle?: string;
  font_weight?: string;
  line_height?: string;
  letter_spacing?: string;
  logo_url?: string;
  meta_title_template?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  theme_mode?: string;
}

export const useBrandSettings = () => {
  const [settings, setSettings] = useState<BrandSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      // Try with authenticated user first, then fallback to public access
      let { data, error } = await supabase
        .from('brand_settings')
        .select('*')
        .single();
      
      // If no data found or error, try again without authentication (for public access)
      if (error && error.code === 'PGRST116') {
        // No data found, use defaults
        setSettings(null);
      } else if (error) {
        console.error('Error fetching brand settings:', error);
        setSettings(null);
      } else {
        // Map new schema to legacy interface for backward compatibility
        const processedData = {
          ...data,
          // Legacy mappings
          primary_color: data.light_primary || '#1A1A1A',
          secondary_color: data.light_secondary || '#666666',
          background_color: data.light_bg || '#F5F6F8',
          text_color: data.light_text || '#1A1A1A',
          site_subtitle: data.site_tagline || '',
          font_sizes: data.font_scale || {
            h1: '1.75rem',
            h2: '1.25rem',
            h3: '1rem',
            body: '1rem',
            small: '0.875rem'
          },
          // Additional legacy mappings
          font_weight: '400',
          line_height: '1.5',
          letter_spacing: '-0.01em',
          logo_url: data.logo_light_url || '',
          meta_title_template: data.seo_title || '{{page}} · {{siteTitle}}',
          meta_description: data.seo_description || '',
          og_title: data.seo_title || '',
          og_description: data.seo_description || '',
          robots_index: data.robots_index ?? true,
          robots_follow: data.robots_follow ?? true,
          theme_mode: 'system'
        };
        setSettings(processedData as BrandSettings);
      }
    } catch (error: any) {
      console.error('Error fetching brand settings:', error);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<BrandSettings>) => {
    try {
      // If no settings exist yet, create them
      if (!settings?.id) {
        const { data, error } = await supabase
          .from('brand_settings')
          .insert([newSettings])
          .select()
          .single();

        if (error) throw error;

        const processedData = mapToLegacyFormat(data);
        setSettings(processedData as BrandSettings);
        applyBrandSettings(processedData as BrandSettings);
        
        toast({
          title: "Configurações criadas",
          description: "As configurações foram criadas com sucesso.",
        });
        
        return data;
      } else {
        // Update existing settings
        const { data, error } = await supabase
          .from('brand_settings')
          .update(newSettings)
          .eq('id', settings.id)
          .select()
          .single();

        if (error) throw error;

        const processedData = mapToLegacyFormat(data);
        setSettings(processedData as BrandSettings);
        applyBrandSettings(processedData as BrandSettings);
        
        toast({
          title: "Configurações atualizadas",
          description: "As alterações foram aplicadas com sucesso.",
        });
        
        return data;
      }
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

  const mapToLegacyFormat = (data: any) => {
    return {
      ...data,
      // Legacy mappings
      primary_color: data.light_primary || '#1A1A1A',
      secondary_color: data.light_secondary || '#666666',
      background_color: data.light_bg || '#F5F6F8',
      text_color: data.light_text || '#1A1A1A',
      site_subtitle: data.site_tagline || '',
      font_sizes: data.font_scale || {},
      // Additional legacy mappings
      font_weight: '400',
      line_height: '1.5',
      letter_spacing: '-0.01em',
      logo_url: data.logo_light_url || '',
      meta_title_template: data.seo_title || '{{page}} · {{siteTitle}}',
      meta_description: data.seo_description || '',
      og_title: data.seo_title || '',
      og_description: data.seo_description || '',
      robots_index: data.robots_index ?? true,
      robots_follow: data.robots_follow ?? true,
      theme_mode: 'system'
    };
  };

  const uploadFile = async (file: File, type: 'logo' | 'favicon' | 'og_image') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // First try to upload to existing bucket, if it doesn't exist, we'll get an error
      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // If bucket doesn't exist, create it first
        if (uploadError.message.includes('Bucket not found')) {
          // Creating brand-assets bucket
          // For now, we'll store in a generic public folder or handle this in the backend
          // Using a data URL as fallback for immediate preview
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      // Fallback to data URL for immediate preview
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  };

  const applyBrandSettings = (brandSettings: BrandSettings) => {
    const root = document.documentElement;
    
    // Apply color variables
    const parseAndApplyColor = (colorValue: string | undefined, cssVarName: string) => {
      if (!colorValue) return; // Guard against undefined/null values
      
      if (colorValue.includes('hsl')) {
        const hslMatch = colorValue.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (hslMatch) {
          root.style.setProperty(`--${cssVarName}`, `${hslMatch[1]} ${hslMatch[2]}% ${hslMatch[3]}%`);
        }
      } else if (colorValue.startsWith('#')) {
        // Convert hex to HSL if needed
        const hsl = hexToHsl(colorValue);
        if (hsl) {
          root.style.setProperty(`--${cssVarName}`, `${hsl.h} ${hsl.s}% ${hsl.l}%`);
        }
      }
    };

    // Apply all color settings
    parseAndApplyColor(brandSettings.primary_color, 'primary');
    parseAndApplyColor(brandSettings.secondary_color, 'secondary');
    parseAndApplyColor(brandSettings.background_color, 'background');
    parseAndApplyColor(brandSettings.text_color, 'foreground');

    // Apply typography settings
    if (brandSettings.font_family) {
      root.style.setProperty('--font-family', brandSettings.font_family);
      document.body.style.fontFamily = `${brandSettings.font_family}, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;
      
      // Load Google Font dynamically
      loadGoogleFont(brandSettings.font_family);
    }

    if (brandSettings.font_weight) {
      root.style.setProperty('--font-weight', brandSettings.font_weight);
    }

    if (brandSettings.line_height) {
      root.style.setProperty('--line-height', brandSettings.line_height);
    }

    if (brandSettings.letter_spacing) {
      root.style.setProperty('--letter-spacing', brandSettings.letter_spacing);
    }

    // Apply font sizes
    if (brandSettings.font_sizes) {
      Object.entries(brandSettings.font_sizes).forEach(([key, value]) => {
        root.style.setProperty(`--font-size-${key}`, String(value));
      });
    }

    // Update favicon if set
    if (brandSettings.favicon_url) {
      updateFavicon(brandSettings.favicon_url);
    }

    // Update page title
    if (brandSettings.site_title) {
      document.title = brandSettings.site_title;
    }

    // Update meta tags
    updateMetaTags(brandSettings);

    // Apply custom CSS
    if (brandSettings.custom_css) {
      applyCustomCSS(brandSettings.custom_css);
    }
  };

  const loadGoogleFont = (fontFamily: string) => {
    // Check if font is already loaded
    const existingLink = document.querySelector(`link[href*="${fontFamily.replace(' ', '+')}"]`);
    if (existingLink) return;

    // Remove existing custom font links
    const existingFontLinks = document.querySelectorAll('link[href*="fonts.googleapis.com"]:not([href*="Inter"])');
    existingFontLinks.forEach(link => link.remove());

    // Add new font link
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@300;400;500;600;700&display=swap`;
    document.head.appendChild(fontLink);
  };

  const updateFavicon = (faviconUrl: string) => {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = faviconUrl;
    } else {
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.href = faviconUrl;
      newFavicon.type = 'image/png';
      document.head.appendChild(newFavicon);
    }
  };

  const updateMetaTags = (brandSettings: BrandSettings) => {
    // Update title
    if (brandSettings.seo_title) {
      document.title = brandSettings.seo_title;
    }

    // Update description
    if (brandSettings.seo_description) {
      let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (metaDesc) {
        metaDesc.content = brandSettings.seo_description;
      } else {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        metaDesc.content = brandSettings.seo_description;
        document.head.appendChild(metaDesc);
      }
    }

    // Update OG tags
    if (brandSettings.og_image_url) {
      updateMetaTag('property', 'og:image', brandSettings.og_image_url);
    }
    if (brandSettings.seo_title) {
      updateMetaTag('property', 'og:title', brandSettings.seo_title);
    }
    if (brandSettings.seo_description) {
      updateMetaTag('property', 'og:description', brandSettings.seo_description);
    }

    // Update Twitter tags
    if (brandSettings.seo_twitter) {
      updateMetaTag('name', 'twitter:site', brandSettings.seo_twitter);
    }

    // Update canonical URL
    if (brandSettings.seo_canonical) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (canonical) {
        canonical.href = brandSettings.seo_canonical;
      } else {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        canonical.href = brandSettings.seo_canonical;
        document.head.appendChild(canonical);
      }
    }
  };

  const updateMetaTag = (attributeName: string, attributeValue: string, content: string) => {
    let metaTag = document.querySelector(`meta[${attributeName}="${attributeValue}"]`) as HTMLMetaElement;
    if (metaTag) {
      metaTag.content = content;
    } else {
      metaTag = document.createElement('meta');
      metaTag.setAttribute(attributeName, attributeValue);
      metaTag.content = content;
      document.head.appendChild(metaTag);
    }
  };

  const applyCustomCSS = (customCSS: string) => {
    let customStyleElement = document.getElementById('brand-custom-css');
    if (!customStyleElement) {
      customStyleElement = document.createElement('style');
      customStyleElement.id = 'brand-custom-css';
      document.head.appendChild(customStyleElement);
    }
    customStyleElement.textContent = customCSS;
  };

  // Helper function to convert hex to HSL
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
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