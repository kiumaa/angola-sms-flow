import React from 'react';
import { usePageMetaTags } from '@/hooks/usePageMetaTags';

interface MetaTagsProviderProps {
  children: React.ReactNode;
}

export const MetaTagsProvider: React.FC<MetaTagsProviderProps> = ({ children }) => {
  // Apply page-specific meta tags (must be inside Router context)
  usePageMetaTags();
  
  return <>{children}</>;
};