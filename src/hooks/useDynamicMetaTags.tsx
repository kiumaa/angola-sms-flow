import { useEffect } from 'react';
import { useBrandSettings } from './useBrandSettings';
import { useLocation } from 'react-router-dom';

interface MetaTagsConfig {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export const useDynamicMetaTags = (pageConfig?: MetaTagsConfig) => {
  const { settings } = useBrandSettings();
  const location = useLocation();

  useEffect(() => {
    if (!settings) return;

    // Get page name from route
    const pageName = getPageNameFromRoute(location.pathname);
    
    // Generate dynamic title
    const titleTemplate = settings.meta_title_template || '{{page}} · {{siteTitle}}';
    const dynamicTitle = titleTemplate
      .replace('{{page}}', pageConfig?.title || pageName)
      .replace('{{siteTitle}}', settings.site_title || 'SMS AO');

    // Update document title
    document.title = dynamicTitle;

    // Update meta description
    const description = pageConfig?.description || settings.meta_description || 'Plataforma de SMS Marketing para Angola';
    updateMetaTag('description', description);

    // Update Open Graph tags
    const ogTitle = pageConfig?.ogTitle || settings.og_title || dynamicTitle;
    const ogDescription = pageConfig?.ogDescription || settings.og_description || description;
    const ogImage = pageConfig?.ogImage || settings.og_image_url;

    updateMetaTag('og:title', ogTitle, 'property');
    updateMetaTag('og:description', ogDescription, 'property');
    updateMetaTag('og:type', 'website', 'property');
    
    if (ogImage) {
      updateMetaTag('og:image', ogImage, 'property');
    }

    // Update Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', 'name');
    updateMetaTag('twitter:title', ogTitle, 'name');
    updateMetaTag('twitter:description', ogDescription, 'name');
    
    if (ogImage) {
      updateMetaTag('twitter:image', ogImage, 'name');
    }

    // Update robots meta tag
    const robotsContent = [
      settings.robots_index ? 'index' : 'noindex',
      settings.robots_follow ? 'follow' : 'nofollow'
    ].join(', ');
    
    updateMetaTag('robots', robotsContent);

    // Update favicon if set
    if (settings.favicon_url) {
      updateFavicon(settings.favicon_url);
    }

    // Apply custom CSS if provided
    if (settings.custom_css) {
      applyCustomCSS(settings.custom_css);
    }

  }, [settings, location.pathname, pageConfig]);

  const updateMetaTag = (name: string, content: string, attribute: string = 'name') => {
    let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
    
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, name);
      document.head.appendChild(meta);
    }
    
    meta.content = content;
  };

  const updateFavicon = (iconUrl: string) => {
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    
    favicon.href = iconUrl;
  };

  const applyCustomCSS = (css: string) => {
    let styleElement = document.getElementById('custom-brand-css') as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'custom-brand-css';
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = css;
  };

  const getPageNameFromRoute = (pathname: string): string => {
    const routeNames: { [key: string]: string } = {
      '/': 'Início',
      '/dashboard': 'Dashboard',
      '/campaigns': 'Campanhas',
      '/contacts': 'Contatos',
      '/quick-send': 'Envio Rápido',
      '/reports': 'Relatórios',
      '/credits': 'Créditos',
      '/sender-ids': 'Sender IDs',
      '/transactions': 'Transações',
      '/settings': 'Configurações',
      '/login': 'Login',
      '/register': 'Registro',
      '/admin': 'Administração',
      '/admin/users': 'Usuários',
      '/admin/transactions': 'Transações Admin',
      '/admin/reports': 'Relatórios Admin',
      '/admin/sms-configuration': 'Configuração SMS',
      '/admin/brand': 'Personalização',
      '/admin/packages': 'Pacotes',
      '/admin/credit-requests': 'Solicitações de Crédito'
    };

    return routeNames[pathname] || 'Página';
  };

  return {
    updatePageMeta: (config: MetaTagsConfig) => {
      // This function can be called to update meta tags for specific pages
      const event = new CustomEvent('updatePageMeta', { detail: config });
      window.dispatchEvent(event);
    }
  };
};

// Hook for individual pages to set their meta tags
export const usePageMeta = (config: MetaTagsConfig) => {
  useDynamicMetaTags(config);
};