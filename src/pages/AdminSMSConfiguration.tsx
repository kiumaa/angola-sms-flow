
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Settings2, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AfricasTalkingConfigSection from "@/components/admin/sms/AfricasTalkingConfigSection";
import SenderIDsSection from "@/components/admin/sms/SenderIDsSection";
import SMSConfigurationHeader from "@/components/admin/sms/SMSConfigurationHeader";

interface SMSConfiguration {
  gateways: {
    bulksms: {
      active: boolean;
      endpoint: string;
      tokenId: string;
      tokenSecret: string;
      defaultSender: string;
      costPerSMS: number;
      status: 'connected' | 'error' | 'disconnected';
      balance?: { credits: number; currency: string };
      error?: string;
    };
    bulkgate: {
      active: boolean;
      endpoint: string;
      appId: string;
      appToken: string;
      defaultSender: string;
      costPerSMS: number;
      status: 'connected' | 'error' | 'disconnected';
      balance?: { credits: number; currency: string };
      error?: string;
    };
  };
  primaryGateway: 'bulksms' | 'bulkgate';
  useFallback: boolean;
  lastUpdated: string;
}

export default function AdminSMSConfiguration() {
  const [config, setConfig] = useState<SMSConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      
      // Buscar configuração dos gateways
      const { data: gateways } = await supabase
        .from('sms_gateways')
        .select('*');

      if (gateways) {
        // Montar configuração baseada nos dados do banco
        const bulksmsGateway = gateways.find(g => g.name === 'bulksms');
        const bulkgateGateway = gateways.find(g => g.name === 'bulkgate');
        const primaryGateway = gateways.find(g => g.is_primary);

        const configData: SMSConfiguration = {
          gateways: {
            bulksms: {
              active: bulksmsGateway?.is_active || false,
              endpoint: bulksmsGateway?.api_endpoint || 'https://api.bulksms.com/v1',
              tokenId: '***',
              tokenSecret: '***',
              defaultSender: 'SMSao',
              costPerSMS: 1,
              status: 'disconnected'
            },
            bulkgate: {
              active: bulkgateGateway?.is_active || false,
              endpoint: bulkgateGateway?.api_endpoint || 'https://api.bulkgate.com/v2.0',
              appId: '***',
              appToken: '***',
              defaultSender: 'SMSao',
              costPerSMS: 1,
              status: 'disconnected'
            }
          },
          primaryGateway: primaryGateway?.name as 'bulksms' | 'bulkgate' || 'bulksms',
          useFallback: true,
          lastUpdated: new Date().toISOString()
        };

        setConfig(configData);
        
        // Verificar status dos gateways
        await checkGatewayStatuses(configData);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações SMS",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkGatewayStatuses = async (currentConfig: SMSConfiguration) => {
    try {
      const [bulksmsStatus, bulkgateStatus] = await Promise.all([
        supabase.functions.invoke('gateway-status', { body: { gateway: 'bulksms' } }),
        supabase.functions.invoke('gateway-status', { body: { gateway: 'bulkgate' } })
      ]);

      const updatedConfig = { ...currentConfig };

      if (bulksmsStatus.data) {
        updatedConfig.gateways.bulksms.status = bulksmsStatus.data.status === 'active' ? 'connected' : 'error';
        updatedConfig.gateways.bulksms.balance = bulksmsStatus.data.balance;
        updatedConfig.gateways.bulksms.error = bulksmsStatus.data.error;
      }

      if (bulkgateStatus.data) {
        updatedConfig.gateways.bulkgate.status = bulkgateStatus.data.status === 'active' ? 'connected' : 'error';
        updatedConfig.gateways.bulkgate.balance = bulkgateStatus.data.balance;
        updatedConfig.gateways.bulkgate.error = bulkgateStatus.data.error;
      }

      setConfig(updatedConfig);
    } catch (error) {
      console.error('Erro ao verificar status dos gateways:', error);
    }
  };

  const refreshStatuses = async () => {
    if (!config) return;
    
    setRefreshing(true);
    await checkGatewayStatuses(config);
    setRefreshing(false);
    
    toast({
      title: "Status Atualizado",
      description: "Status dos gateways foi verificado novamente"
    });
  };

  const saveConfiguration = async (newConfig: SMSConfiguration) => {
    try {
      setSaving(true);

      // Atualizar configuração dos gateways no banco
      const updates = [
        supabase
          .from('sms_gateways')
          .update({ 
            is_active: newConfig.gateways.bulksms.active,
            is_primary: newConfig.primaryGateway === 'bulksms',
            updated_at: new Date().toISOString()
          })
          .eq('name', 'bulksms'),
        
        supabase
          .from('sms_gateways')
          .update({ 
            is_active: newConfig.gateways.bulkgate.active,
            is_primary: newConfig.primaryGateway === 'bulkgate',
            updated_at: new Date().toISOString()
          })
          .eq('name', 'bulkgate')
      ];

      await Promise.all(updates);

      setConfig(newConfig);
      
      toast({
        title: "Configuração Salva",
        description: "As configurações SMS foram atualizadas com sucesso"
      });
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Configuração SMS</h2>
            <p className="text-muted-foreground">
              Configuração do Africa's Talking como provedor SMS exclusivo
            </p>
          </div>
          <Button
            onClick={refreshStatuses}
            disabled={refreshing}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar Status</span>
          </Button>
        </div>

        <AfricasTalkingConfigSection 
          config={{
            active: true,
            username: 'kiumaf',
            defaultSender: 'SHORTCODE',
            status: 'connected'
          }}
          onSave={async (config) => {
            console.log('Saving Africa\'s Talking config:', config);
            // Atualizar gateway no banco como ativo
            await supabase
              .from('sms_gateways')
              .upsert({
                name: 'africastalking',
                display_name: 'Africa\'s Talking',
                api_endpoint: 'https://api.africastalking.com/version1',
                auth_type: 'api_key',
                is_active: config.active,
                is_primary: true,
                updated_at: new Date().toISOString()
              });
            
            await refreshStatuses();
            
            toast({
              title: "Configuração Salva",
              description: "Africa's Talking configurado com sucesso"
            });
          }}
          saving={saving}
        />
      </div>
    </div>
  );
}
