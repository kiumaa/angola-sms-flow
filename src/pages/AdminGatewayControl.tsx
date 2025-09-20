import React from 'react';
import { GatewayOverrideController } from '@/components/admin/GatewayOverrideController';
import CountryRoutingDashboard from '@/components/admin/CountryRoutingDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGatewayOverride } from '@/hooks/useGatewayOverride';
import { AlertTriangle, CheckCircle, Settings, Globe } from 'lucide-react';

const AdminGatewayControl: React.FC = () => {
  const { override, loading } = useGatewayOverride();

  const currentStatus = override?.override_type || 'none';
  const isOverrideActive = currentStatus !== 'none';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Controle de Gateways SMS</h1>
        <p className="text-muted-foreground">
          Gerencie o roteamento automático e manual dos gateways SMS
        </p>
      </div>

      {/* Status Alert */}
      {!loading && (
        <Card className={isOverrideActive ? "border-orange-200 bg-orange-50/50" : "border-green-200 bg-green-50/50"}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {isOverrideActive ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">
                      Override Manual Ativo
                    </p>
                    <p className="text-sm text-orange-700">
                      {currentStatus === 'force_bulksms' 
                        ? 'Todos os SMS estão sendo enviados via BulkSMS'
                        : 'Todos os SMS estão sendo enviados via BulkGate'
                      }
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">
                      Roteamento Automático Ativo
                    </p>
                    <p className="text-sm text-green-700">
                      SMS sendo roteados automaticamente por país
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Controle Manual */}
        <div className="space-y-6">
          <GatewayOverrideController />
          
          {/* Informações sobre Gateways */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Informações dos Gateways
              </CardTitle>
              <CardDescription>
                Configuração e uso recomendado de cada gateway
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">BulkGate</p>
                    <p className="text-sm text-muted-foreground">
                      Recomendado para países PALOP (Angola, Moçambique, etc.)
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Angola: SMSAO
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">BulkSMS</p>
                    <p className="text-sm text-muted-foreground">
                      Recomendado para outros países internacionais
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Global
                  </Badge>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>Sender ID:</strong> O sistema usa automaticamente "SMSAO" como padrão, 
                  mas utiliza Sender IDs personalizados aprovados quando disponíveis.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard de Roteamento */}
        <div>
          <CountryRoutingDashboard />
        </div>
      </div>
    </div>
  );
};

export default AdminGatewayControl;