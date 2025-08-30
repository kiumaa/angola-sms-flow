import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface MetaTagConfig {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
}

const getMetaForRoute = (pathname: string): MetaTagConfig => {
  switch (pathname) {
    case '/':
      return {
        title: 'SMS AO — SMS Marketing em Angola. Nunca foi tão fácil',
        description: 'Envie SMS em massa de forma simples e rápida. Gestão de contactos, relatórios e suporte 24/7. Experimente grátis.',
        canonical: 'https://sms.kbagency.me/',
        keywords: 'SMS marketing Angola, envio SMS massa, marketing digital Angola'
      };
    
    case '/credits':
    case '/checkout':
      return {
        title: 'Preços — SMS AO: planos simples e transparentes',
        description: 'Escolha o plano ideal para a sua empresa. Envio de SMS, gestão de contactos e relatórios com suporte 24/7.',
        canonical: 'https://sms.kbagency.me/credits',
        keywords: 'preços SMS Angola, planos SMS marketing, créditos SMS'
      };
    
    case '/quick-send':
      return {
        title: 'SMS Rápido — Envie SMS em segundos | SMS AO',
        description: 'Dispare mensagens para um ou múltiplos contactos em segundos. Entrega fiável e relatórios claros.',
        canonical: 'https://sms.kbagency.me/quick-send',
        keywords: 'envio SMS rápido, SMS instantâneo Angola, enviar SMS online'
      };
    
    case '/login':
      return {
        title: 'Entrar — SMS AO',
        description: 'Acesse a sua conta SMS AO e gerencie as suas campanhas de SMS marketing.',
        canonical: 'https://sms.kbagency.me/login'
      };
    
    case '/register':
      return {
        title: 'Criar Conta — SMS AO',
        description: 'Crie a sua conta gratuita e comece a enviar SMS para os seus clientes hoje mesmo.',
        canonical: 'https://sms.kbagency.me/register'
      };
    
    case '/dashboard':
      return {
        title: 'Dashboard — SMS AO',
        description: 'Gerencie as suas campanhas de SMS, contactos e relatórios no seu painel de controlo.',
        canonical: 'https://sms.kbagency.me/dashboard'
      };
    
    case '/contacts':
      return {
        title: 'Contactos — SMS AO',
        description: 'Gerencie os seus contactos, importe listas e organize por grupos para campanhas eficazes.',
        canonical: 'https://sms.kbagency.me/contacts'
      };
    
    default:
      return {
        title: 'SMS AO — Plataforma de SMS Marketing para Angola',
        description: 'Conecte sua empresa aos clientes através de SMS marketing profissional em Angola.',
        canonical: 'https://sms.kbagency.me/'
      };
  }
};

const updateMetaTag = (name: string, content: string) => {
  let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!element) {
    element = document.createElement('meta');
    element.name = name;
    document.head.appendChild(element);
  }
  element.content = content;
};

const updateOGTag = (property: string, content: string) => {
  let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }
  element.content = content;
};

const updateCanonical = (href: string) => {
  let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!element) {
    element = document.createElement('link');
    element.rel = 'canonical';
    document.head.appendChild(element);
  }
  element.href = href;
};

export const usePageMetaTags = () => {
  const location = useLocation();

  useEffect(() => {
    const metaConfig = getMetaForRoute(location.pathname);
    
    // Update document title
    document.title = metaConfig.title;
    
    // Update meta description
    updateMetaTag('description', metaConfig.description);
    
    // Update keywords if provided
    if (metaConfig.keywords) {
      updateMetaTag('keywords', metaConfig.keywords);
    }
    
    // Update canonical URL
    if (metaConfig.canonical) {
      updateCanonical(metaConfig.canonical);
    }
    
    // Update Open Graph tags
    updateOGTag('og:title', metaConfig.title);
    updateOGTag('og:description', metaConfig.description);
    if (metaConfig.canonical) {
      updateOGTag('og:url', metaConfig.canonical);
    }
    
    // Update Twitter Card tags
    updateOGTag('twitter:title', metaConfig.title);
    updateOGTag('twitter:description', metaConfig.description);
    if (metaConfig.canonical) {
      updateOGTag('twitter:url', metaConfig.canonical);
    }
    
  }, [location.pathname]);
};