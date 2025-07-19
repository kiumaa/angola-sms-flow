
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TestTube, BarChart3 } from "lucide-react";
import SMSGatewayMonitoring from "@/components/admin/SMSGatewayMonitoring";
import SMSGatewayTester from "@/components/admin/SMSGatewayTester";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminSMSMonitoring() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Activity className="h-8 w-8" />
            <span>Monitoramento SMS</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitore o desempenho dos gateways SMS e execute testes de conectividade
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="monitoring" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="monitoring" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Monitoramento</span>
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center space-x-2">
              <TestTube className="h-4 w-4" />
              <span>Testes</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="monitoring" className="mt-6">
            <SMSGatewayMonitoring />
          </TabsContent>
          
          <TabsContent value="testing" className="mt-6">
            <SMSGatewayTester />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
