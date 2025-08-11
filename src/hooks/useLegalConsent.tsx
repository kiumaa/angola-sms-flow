import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ConsentRecord {
  id: string;
  document: 'terms' | 'privacy';
  version: string;
  accepted_at: string;
  ip_address?: string;
}

export function useLegalConsent() {
  const [needsConsent, setNeedsConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userIp, setUserIp] = useState<string>();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    checkConsentNeeded();
  }, [user]);

  // Get user's IP address for consent logging
  useEffect(() => {
    const getUserIp = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setUserIp(data.ip);
      } catch (error) {
        console.log('Could not get IP address:', error);
        // IP is optional, don't block the flow
      }
    };

    getUserIp();
  }, []);

  const checkConsentNeeded = async () => {
    if (!user) return;

    try {
      // Get current legal versions
      const { data: settings, error: settingsError } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['LEGAL_TERMS_VERSION', 'LEGAL_PRIVACY_VERSION']);

      if (settingsError) {
        console.error('Error fetching legal versions:', settingsError);
        setLoading(false);
        return;
      }

      const termsVersion = settings?.find(s => s.key === 'LEGAL_TERMS_VERSION')?.value || '1.0';
      const privacyVersion = settings?.find(s => s.key === 'LEGAL_PRIVACY_VERSION')?.value || '1.0';

      // Check if user has consented to current versions
      const { data: consents, error: consentsError } = await supabase
        .from('user_consents')
        .select('document, version')
        .eq('user_id', user.id)
        .in('document', ['terms', 'privacy']);

      if (consentsError) {
        console.error('Error fetching user consents:', consentsError);
        setLoading(false);
        return;
      }

      const hasTermsConsent = consents?.some(c => c.document === 'terms' && c.version === termsVersion);
      const hasPrivacyConsent = consents?.some(c => c.document === 'privacy' && c.version === privacyVersion);

      setNeedsConsent(!hasTermsConsent || !hasPrivacyConsent);
    } catch (error) {
      console.error('Error checking consent status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserConsents = async (): Promise<ConsentRecord[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('user_consents')
        .select('id, document, version, accepted_at, ip_address')
        .eq('user_id', user.id)
        .order('accepted_at', { ascending: false });

      if (error) {
        console.error('Error fetching user consents:', error);
        return [];
      }

      return (data as ConsentRecord[]) || [];
    } catch (error) {
      console.error('Error fetching user consents:', error);
      return [];
    }
  };

  const refreshConsentStatus = () => {
    if (user) {
      setLoading(true);
      checkConsentNeeded();
    }
  };

  return {
    needsConsent,
    loading,
    userIp,
    getUserConsents,
    refreshConsentStatus
  };
}