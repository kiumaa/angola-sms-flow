import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAdvancedBrandSettings } from './useAdvancedBrandSettings';

export const useThemeManager = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const { settings } = useAdvancedBrandSettings();

  // Get the effective theme (resolve 'system')
  const effectiveTheme = theme === 'system' ? systemTheme : theme;

  // Apply theme-aware CSS variables when theme or settings change
  useEffect(() => {
    if (!settings || !effectiveTheme) return;

    const root = document.documentElement;
    
    // Set data-theme attribute for CSS selectors
    root.setAttribute('data-theme', effectiveTheme);

    // Apply colors based on current theme
    if (effectiveTheme === 'dark') {
      root.style.setProperty('--color-primary', settings.dark_primary);
      root.style.setProperty('--color-secondary', settings.dark_secondary);
      root.style.setProperty('--color-bg', settings.dark_bg);
      root.style.setProperty('--color-text', settings.dark_text);
    } else {
      root.style.setProperty('--color-primary', settings.light_primary);
      root.style.setProperty('--color-secondary', settings.light_secondary);
      root.style.setProperty('--color-bg', settings.light_bg);
      root.style.setProperty('--color-text', settings.light_text);
    }

  }, [effectiveTheme, settings]);

  // Prevent FOUC by applying theme class early
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme immediately to prevent flash
    if (effectiveTheme) {
      root.setAttribute('data-theme', effectiveTheme);
    }

    // Listen for system theme changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'dark' : 'light';
        root.setAttribute('data-theme', newTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, effectiveTheme]);

  return {
    theme,
    effectiveTheme,
    setTheme,
    isDark: effectiveTheme === 'dark'
  };
};