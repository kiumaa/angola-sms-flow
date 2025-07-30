import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RouteeContextType {
  isConfigured: boolean;
  isActive: boolean;
  lastTestedAt: string | null;
  testStatus: 'success' | 'error' | null;
  balance: number;
  refreshConfig: () => Promise<void>;
  sendTestSMS: (phoneNumber: string, message: string, senderId: string) => Promise<boolean>;
}

const RouteeContext = createContext<RouteeContextType | undefined>(undefined);

export function RouteeProvider({ children }: { children: ReactNode }) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'success' | 'error' | null>(null);
  const [balance, setBalance] = useState(0);

  const refreshConfig = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('routee_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading Routee config:', error);
        return;
      }

      if (settings) {
        setIsConfigured(Boolean(settings.api_token_encrypted));
        setIsActive(settings.is_active);
        setLastTestedAt(settings.last_tested_at);
        setTestStatus(settings.test_status as 'success' | 'error' | null);
        setBalance(settings.balance_eur || 0);
      } else {
        // No configuration found
        setIsConfigured(false);
        setIsActive(false);
        setLastTestedAt(null);
        setTestStatus(null);
        setBalance(0);
      }
    } catch (error) {
      console.error('Error refreshing Routee config:', error);
    }
  };

  const sendTestSMS = async (phoneNumber: string, message: string, senderId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          contacts: [phoneNumber],
          message,
          senderId,
          isTest: true
        }
      });

      if (error) throw error;
      return data.success;
    } catch (error) {
      console.error('Error sending test SMS:', error);
      return false;
    }
  };

  useEffect(() => {
    refreshConfig();
    
    // Subscribe to changes in routee_settings
    const subscription = supabase
      .channel('routee_settings_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'routee_settings'
      }, () => {
        refreshConfig();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: RouteeContextType = {
    isConfigured,
    isActive,
    lastTestedAt,
    testStatus,
    balance,
    refreshConfig,
    sendTestSMS
  };

  return (
    <RouteeContext.Provider value={value}>
      {children}
    </RouteeContext.Provider>
  );
}

export function useRouteeGateway() {
  const context = useContext(RouteeContext);
  if (context === undefined) {
    throw new Error('useRouteeGateway must be used within a RouteeProvider');
  }
  return context;
}

// Hook simples para verificar se o Routee está pronto para produção
export function useRouteeProductionStatus() {
  const { isConfigured, isActive, testStatus } = useRouteeGateway();
  
  const isProductionReady = isConfigured && isActive && testStatus === 'success';
  const statusMessage = !isConfigured 
    ? 'Token da API não configurado'
    : !isActive 
    ? 'Gateway desativado'
    : testStatus !== 'success'
    ? 'Teste de conexão falhando'
    : 'Pronto para produção';

  return {
    isProductionReady,
    statusMessage,
    needsAttention: !isProductionReady
  };
}