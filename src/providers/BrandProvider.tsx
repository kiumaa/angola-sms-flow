import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useBrandSettings } from '@/hooks/useBrandSettings';
import { useDynamicMetaTags } from '@/hooks/useDynamicMetaTags';

interface BrandContextType {
  settings: any;
  loading: boolean;
  updateSettings: (settings: any) => Promise<any>;
  uploadFile: (file: File, type: 'logo' | 'favicon') => Promise<string>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const useBrandContext = () => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrandContext must be used within a BrandProvider');
  }
  return context;
};

interface BrandProviderProps {
  children: ReactNode;
}

export const BrandProvider = ({ children }: BrandProviderProps) => {
  const brandSettings = useBrandSettings();
  
  // Initialize dynamic meta tags
  useDynamicMetaTags();

  return (
    <BrandContext.Provider value={brandSettings}>
      {children}
    </BrandContext.Provider>
  );
};