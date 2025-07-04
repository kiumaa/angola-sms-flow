import { useEffect } from "react";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export const useDynamicBranding = () => {
  const { settings: brandSettings, loading: brandLoading } = useBrandSettings();
  const { settings: siteSettings, loading: siteLoading } = useSiteSettings();

  useEffect(() => {
    if (brandLoading || siteLoading) return;

    const applyDynamicStyles = () => {
      const root = document.documentElement;
      
      // Apply brand colors if available
      if (brandSettings?.primary_color) {
        const primaryMatch = brandSettings.primary_color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (primaryMatch) {
          root.style.setProperty('--primary', `${primaryMatch[1]} ${primaryMatch[2]}% ${primaryMatch[3]}%`);
        }
      }
      
      if (brandSettings?.secondary_color) {
        const secondaryMatch = brandSettings.secondary_color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (secondaryMatch) {
          root.style.setProperty('--secondary', `${secondaryMatch[1]} ${secondaryMatch[2]}% ${secondaryMatch[3]}%`);
        }
      }

      // Update document title if available
      if (siteSettings?.site_title) {
        document.title = siteSettings.site_title;
      }

      // Update favicon if available
      if (brandSettings?.favicon_url) {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
          favicon.href = brandSettings.favicon_url;
        } else {
          // Create favicon if it doesn't exist
          const newFavicon = document.createElement('link');
          newFavicon.rel = 'icon';
          newFavicon.href = brandSettings.favicon_url;
          document.head.appendChild(newFavicon);
        }
      }
    };

    applyDynamicStyles();
  }, [brandSettings, siteSettings, brandLoading, siteLoading]);

  return {
    isLoading: brandLoading || siteLoading,
    brandSettings,
    siteSettings
  };
};