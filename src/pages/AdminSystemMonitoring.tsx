import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, BarChart3, Settings, HeartHandshake } from "lucide-react";
import CampaignMonitoringDashboard from "@/components/admin/CampaignMonitoringDashboard";
import SMSGatewayMonitoring from "@/components/admin/SMSGatewayMonitoring";
import SystemHealthDashboard from "@/components/admin/SystemHealthDashboard";

const AdminSystemMonitoring = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Activity className="h-8 w-8" />
            <span>Monitoramento do Sistema</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitore a saúde geral do sistema, campanhas e gateways SMS
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="health" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="health" className="flex items-center space-x-2">
              <HeartHandshake className="h-4 w-4" />
              <span>Saúde do Sistema</span>
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Campanhas</span>
            </TabsTrigger>
            <TabsTrigger value="gateways" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Gateways SMS</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="health" className="mt-6">
            <SystemHealthDashboard />
          </TabsContent>

          <TabsContent value="campaigns" className="mt-6">
            <CampaignMonitoringDashboard />
          </TabsContent>
          
          <TabsContent value="gateways" className="mt-6">
            <SMSGatewayMonitoring />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSystemMonitoring;