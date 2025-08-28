import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Settings, HeartHandshake } from "lucide-react";
import SMSGatewayMonitoring from "@/components/admin/SMSGatewayMonitoring";
import SystemHealthDashboard from "@/components/admin/SystemHealthDashboard";

const AdminSystemMonitoring = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <Activity className="h-10 w-10 text-primary" />
            <span>Monitoramento do Sistema</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Visão centralizada da saúde do sistema e status dos gateways SMS
          </p>
        </header>

        {/* Unified Content Layout */}
        <Tabs defaultValue="health" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 mb-8">
            <TabsTrigger value="health" className="flex items-center gap-2 py-4">
              <HeartHandshake className="h-5 w-5" />
              <span className="font-medium">Saúde do Sistema</span>
            </TabsTrigger>
            <TabsTrigger value="gateways" className="flex items-center gap-2 py-4">
              <Settings className="h-5 w-5" />
              <span className="font-medium">Gateways SMS</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="health" className="mt-8 space-y-8">
            <SystemHealthDashboard />
          </TabsContent>
          
          <TabsContent value="gateways" className="mt-8 space-y-8">
            <SMSGatewayMonitoring />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSystemMonitoring;