import { useEffect } from 'react';

export const SecurityHeaders = () => {
  useEffect(() => {
    // Security: Set CSP meta tag if not already present
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https://*.supabase.co https://*.githubusercontent.com",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "frame-ancestors 'none'",
        "form-action 'self'"
      ].join('; ');
      document.head.appendChild(cspMeta);
    }

    // Security: Set X-Frame-Options if not present
    if (!document.querySelector('meta[http-equiv="X-Frame-Options"]')) {
      const frameOptions = document.createElement('meta');
      frameOptions.httpEquiv = 'X-Frame-Options';
      frameOptions.content = 'DENY';
      document.head.appendChild(frameOptions);
    }

    // Security: Set X-Content-Type-Options
    if (!document.querySelector('meta[http-equiv="X-Content-Type-Options"]')) {
      const contentTypeOptions = document.createElement('meta');
      contentTypeOptions.httpEquiv = 'X-Content-Type-Options';
      contentTypeOptions.content = 'nosniff';
      document.head.appendChild(contentTypeOptions);
    }

    // Security: Set Referrer-Policy
    if (!document.querySelector('meta[name="referrer"]')) {
      const referrerPolicy = document.createElement('meta');
      referrerPolicy.name = 'referrer';
      referrerPolicy.content = 'strict-origin-when-cross-origin';
      document.head.appendChild(referrerPolicy);
    }
  }, []);

  return null;
};