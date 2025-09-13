import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useGatewayOverride } from '@/hooks/useGatewayOverride';
import { useToast } from '@/hooks/use-toast';
import { Clock, Settings, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

const TIMEOUT_OPTIONS = [
  { value: null, label: 'Permanente' },
  { value: 1, label: '1 hora' },
  { value: 4, label: '4 horas' },
  { value: 8, label: '8 horas' },
  { value: 24, label: '24 horas' }
];

const OVERRIDE_TYPES = [
  { 
    value: 'none', 
    label: '🔄 Automático', 
    description: 'Roteamento inteligente por país',
    color: 'bg-primary/10 text-primary border-primary/20'
  },
  { 
    value: 'force_bulksms', 
    label: '📱 Forçar BulkSMS', 
    description: 'Todos os SMS via BulkSMS',
    color: 'bg-blue-500/10 text-blue-700 border-blue-500/20'
  },
  { 
    value: 'force_bulkgate', 
    label: '🌍 Forçar BulkGate', 
    description: 'Todos os SMS via BulkGate',
    color: 'bg-green-500/10 text-green-700 border-green-500/20'
  }
];

export const GatewayOverrideController: React.FC = () => {
  const { override, loading, setGatewayOverride, clearOverride } = useGatewayOverride();
  const { toast } = useToast();
  
  const [selectedType, setSelectedType] = useState<'none' | 'force_bulksms' | 'force_bulkgate'>('none');
  const [selectedTimeout, setSelectedTimeout] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentOverrideType = override?.override_type || 'none';
  const currentTypeConfig = OVERRIDE_TYPES.find(t => t.value === currentOverrideType);
  
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const expiresAt = selectedTimeout 
        ? new Date(Date.now() + selectedTimeout * 60 * 60 * 1000)
        : undefined;
      
      await setGatewayOverride(selectedType, expiresAt, reason);
      
      toast({
        title: "Override aplicado com sucesso",
        description: selectedType === 'none' 
          ? "Roteamento automático ativado"
          : `Gateway ${selectedType === 'force_bulksms' ? 'BulkSMS' : 'BulkGate'} será usado para todos os SMS`,
      });
      
      // Reset form
      setSelectedType('none');
      setSelectedTimeout(null);
      setReason('');
    } catch (error: any) {
      toast({
        title: "Erro ao aplicar override",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickClear = async () => {
    try {
      await clearOverride();
      toast({
        title: "Override removido",
        description: "Roteamento automático ativado"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover override",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Controle Manual de Gateway
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Controle Manual de Gateway
        </CardTitle>
        <CardDescription>
          Forçar o uso de um gateway específico ou usar roteamento automático
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Atual */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Status Atual</Label>
          <div className="flex items-center gap-3">
            <Badge className={currentTypeConfig?.color}>
              {currentOverrideType === 'none' ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertTriangle className="h-3 w-3 mr-1" />
              )}
              {currentTypeConfig?.label}
            </Badge>
            {override?.expires_at && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Expira {formatDistanceToNow(new Date(override.expires_at), { 
                  addSuffix: true, 
                  locale: pt 
                })}
              </Badge>
            )}
          </div>
          {currentTypeConfig && (
            <p className="text-sm text-muted-foreground">
              {currentTypeConfig.description}
            </p>
          )}
          {override?.reason && (
            <p className="text-sm text-muted-foreground">
              <strong>Motivo:</strong> {override.reason}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        {currentOverrideType !== 'none' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickClear}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Voltar ao Automático
            </Button>
          </div>
        )}

        {/* Formulário de Override */}
        <div className="space-y-4 pt-4 border-t">
          <Label className="text-sm font-medium">Aplicar Novo Override</Label>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="override-type">Tipo de Override</Label>
              <Select 
                value={selectedType} 
                onValueChange={(value: any) => setSelectedType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {OVERRIDE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {type.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedType !== 'none' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Duração</Label>
                  <Select 
                    value={selectedTimeout?.toString() || 'null'} 
                    onValueChange={(value) => setSelectedTimeout(value === 'null' ? null : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a duração" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEOUT_OPTIONS.map((option) => (
                        <SelectItem 
                          key={option.value?.toString() || 'null'} 
                          value={option.value?.toString() || 'null'}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo (Opcional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Ex: Manutenção do BulkGate, teste de performance..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                className="w-full" 
                disabled={isSubmitting}
                variant={selectedType === 'none' ? 'default' : 'destructive'}
              >
                {isSubmitting ? (
                  "Aplicando..."
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    {selectedType === 'none' ? 'Ativar Automático' : 'Aplicar Override Manual'}
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Override</AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedType === 'none' 
                    ? "Tem certeza que deseja ativar o roteamento automático? Todos os SMS serão enviados de acordo com as regras por país."
                    : `Tem certeza que deseja forçar todos os SMS a usar ${
                        selectedType === 'force_bulksms' ? 'BulkSMS' : 'BulkGate'
                      }? Esta ação afetará todos os envios até ser desativada.`
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};