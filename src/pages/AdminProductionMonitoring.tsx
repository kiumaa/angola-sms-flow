import React from 'react';
import ProductionReadinessChecklist from '@/components/admin/ProductionReadinessChecklist';
import { usePageMeta } from '@/hooks/useDynamicMetaTags';

const AdminProductionMonitoring = () => {
  // Set page meta tags
  usePageMeta({
    title: 'Monitorização de Produção',
    description: 'Dashboard de segurança, performance e integridade do sistema SMS AO'
  });

  return <ProductionReadinessChecklist />;
};

export default AdminProductionMonitoring;