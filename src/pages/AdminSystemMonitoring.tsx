import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Settings, HeartHandshake } from "lucide-react";
import SMSGatewayMonitoring from "@/components/admin/SMSGatewayMonitoring";
import SystemHealthDashboard from "@/components/admin/SystemHealthDashboard";

const AdminSystemMonitoring = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="glass-card p-8 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="relative">
            <h1 className="text-4xl font-light gradient-text mb-2 flex items-center space-x-3">
              <div className="p-3 rounded-3xl bg-gradient-primary shadow-glow animate-glow">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <span>Monitoramento do Sistema</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Visão centralizada da saúde do sistema e status dos gateways SMS
            </p>
          </div>
        </div>

        {/* Enhanced Content Layout */}
        <Tabs defaultValue="health" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 mb-8 glass-card">
            <TabsTrigger value="health" className="flex items-center gap-2 py-4 rounded-xl transition-all duration-300 hover-lift">
              <HeartHandshake className="h-5 w-5" />
              <span className="font-medium">Saúde do Sistema</span>
            </TabsTrigger>
            <TabsTrigger value="gateways" className="flex items-center gap-2 py-4 rounded-xl transition-all duration-300 hover-lift">
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