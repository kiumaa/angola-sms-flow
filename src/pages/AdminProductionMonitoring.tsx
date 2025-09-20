import React from 'react';
import { ProductionReadinessChecklist } from '@/components/admin/ProductionReadinessChecklist';

export default function AdminProductionMonitoring() {
  return (
    <div className="space-y-6">
      <ProductionReadinessChecklist />
    </div>
  );
}