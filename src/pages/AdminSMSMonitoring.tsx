
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TestTube, BarChart3, Webhook } from "lucide-react";
import SMSGatewayMonitoring from "@/components/admin/SMSGatewayMonitoring";
import SMSGatewayTester from "@/components/admin/SMSGatewayTester";
import SMSDeliveryDiagnostics from "@/components/admin/SMSDeliveryDiagnostics";
import AdminLayout from "@/components/layout/AdminLayout";

export default function AdminSMSMonitoring() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <Activity className="h-10 w-10 text-primary" />
            <span>Monitoramento SMS</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Monitore o desempenho dos gateways SMS, execute diagnósticos e teste a conectividade em tempo real
          </p>
        </header>

        {/* Content without duplicated internal menus */}
        <div className="space-y-8">
          <SMSGatewayMonitoring />
          
          <div className="mt-12 pt-8 border-t border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Diagnósticos e Testes</h2>
            <Tabs defaultValue="diagnostics" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="diagnostics" className="flex items-center gap-2 py-3">
                  <Webhook className="h-5 w-5" />
                  <span>Diagnóstico Avançado</span>
                </TabsTrigger>
                <TabsTrigger value="testing" className="flex items-center gap-2 py-3">
                  <TestTube className="h-5 w-5" />
                  <span>Testes de Conectividade</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="diagnostics" className="mt-8">
                <SMSDeliveryDiagnostics />
              </TabsContent>
              
              <TabsContent value="testing" className="mt-8">
                <SMSGatewayTester />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
