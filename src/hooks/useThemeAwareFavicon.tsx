import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import faviconDark from '@/assets/favicon-dark.png';
import faviconLight from '@/assets/favicon-light.png';

export const useThemeAwareFavicon = () => {
  const { theme, systemTheme } = useTheme();

  useEffect(() => {
    // Determine current theme
    const currentTheme = theme === 'system' ? systemTheme : theme;
    const isDark = currentTheme === 'dark';

    // Select appropriate favicon
    const faviconUrl = isDark ? faviconDark : faviconLight;

    // Update favicon
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/png';
      document.head.appendChild(favicon);
    }
    
    favicon.href = faviconUrl;
  }, [theme, systemTheme]);
};