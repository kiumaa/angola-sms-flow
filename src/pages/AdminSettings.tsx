import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, MessageSquare, Send } from "lucide-react";
import AdminSMSSettings from "./AdminSMSSettings";
import AdminSenderIDs from "./AdminSenderIDs";

const AdminSettings = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Settings className="h-8 w-8" />
          <span>Configurações</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Gerencie todas as configurações do sistema
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sms" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sms" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Configurações SMS</span>
          </TabsTrigger>
          <TabsTrigger value="sender-ids" className="flex items-center space-x-2">
            <Send className="h-4 w-4" />
            <span>Sender IDs</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sms" className="mt-6">
          <AdminSMSSettings />
        </TabsContent>
        
        <TabsContent value="sender-ids" className="mt-6">
          <AdminSenderIDs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;