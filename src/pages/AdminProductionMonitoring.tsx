import { ProductionMonitoringDashboard } from '@/components/admin/ProductionMonitoringDashboard';
import { ProductionReadinessChecklist } from '@/components/admin/ProductionReadinessChecklist';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminProductionMonitoring() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="monitoring" className="w-full">
        <TabsList>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
        </TabsList>
        <TabsContent value="monitoring">
          <ProductionMonitoringDashboard />
        </TabsContent>
        <TabsContent value="checklist">
          <ProductionReadinessChecklist />
        </TabsContent>
      </Tabs>
    </div>
  );
}