import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calculator, CreditCard, Users, AlertTriangle, Globe } from "lucide-react";
import { calculateSMSSegments } from "@/lib/smsUtils";
import { cn } from "@/lib/utils";
import { useCountryPricing } from "@/hooks/useCountryPricing";
import { analyzePhoneNumbersCosts, formatCostBreakdown } from "@/lib/countryPricingUtils";

interface CreditEstimatorProps {
  message: string;
  recipientCount: number;
  userCredits: number;
  className?: string;
  phoneNumbers?: string[]; // Lista de números para análise de país
}

export function CreditEstimator({ 
  message, 
  recipientCount, 
  userCredits, 
  className,
  phoneNumbers = []
}: CreditEstimatorProps) {
  const { pricing, loading: pricingLoading } = useCountryPricing();
  
  const estimation = useMemo(() => {
    if (!message || recipientCount === 0) {
      return {
        segmentInfo: { segments: 1, encoding: 'GSM7' as const, totalChars: 0, isValid: true },
        totalCredits: 0,
        costPerSms: 1,
        canAfford: true,
        remainingCredits: userCredits,
        costAnalysis: null
      };
    }

    const segmentInfo = calculateSMSSegments(message);
    const baseCreditsPerSms = segmentInfo.segments;
    
    // Análise de custos por país se temos números específicos
    let costAnalysis = null;
    let totalCredits = baseCreditsPerSms * recipientCount;
    
    if (phoneNumbers.length > 0 && pricing.length > 0) {
      costAnalysis = analyzePhoneNumbersCosts(phoneNumbers, pricing);
      totalCredits = costAnalysis.totalCredits * baseCreditsPerSms;
    }
    
    const canAfford = totalCredits <= userCredits;
    const remainingCredits = userCredits - totalCredits;

    return {
      segmentInfo,
      totalCredits,
      costPerSms: baseCreditsPerSms,
      canAfford,
      remainingCredits,
      costAnalysis
    };
  }, [message, recipientCount, userCredits, phoneNumbers, pricing]);

  const creditUsagePercentage = userCredits > 0 ? 
    Math.min((estimation.totalCredits / userCredits) * 100, 100) : 0;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calculator className="h-4 w-4" />
          Estimativa de Custos
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Recipients */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Destinatários:</span>
          </div>
          <Badge variant="outline" className="font-mono">
            {recipientCount.toLocaleString()}
          </Badge>
        </div>

        {/* Cost per SMS */}
        <div className="flex items-center justify-between text-sm">
          <span>Custo base por SMS:</span>
          <Badge variant={estimation.segmentInfo.segments > 1 ? "destructive" : "default"}>
            {estimation.costPerSms} crédito{estimation.costPerSms > 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Breakdown por país se disponível */}
        {estimation.costAnalysis && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4" />
              <span>Custos por País:</span>
            </div>
            {estimation.costAnalysis.breakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span>{item.countryName}: {item.count} SMS</span>
                <Badge variant={item.multiplier > 1 ? "secondary" : "outline"} className="text-xs">
                  {item.totalCredits * estimation.costPerSms} créditos
                  {item.multiplier > 1 && ` (${item.multiplier}x)`}
                </Badge>
              </div>
            ))}
            {estimation.costAnalysis.hasMultipliers && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded">
                <AlertTriangle className="h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  Alguns destinos têm custos diferenciados
                </div>
              </div>
            )}
          </div>
        )}

        {/* Total cost */}
        <div className="flex items-center justify-between text-sm font-medium">
          <span>Custo total:</span>
          <Badge variant={estimation.canAfford ? "default" : "destructive"} className="font-mono">
            {estimation.totalCredits.toLocaleString()} créditos
          </Badge>
        </div>

        {/* Credit balance and usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Saldo atual:</span>
            <span className="font-mono">{userCredits.toLocaleString()}</span>
          </div>
          
          <Progress 
            value={creditUsagePercentage} 
            className={cn(
              "h-2",
              creditUsagePercentage > 80 && "text-amber-500",
              !estimation.canAfford && "text-destructive"
            )}
          />
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Após envio:</span>
            <span className={cn(
              "font-mono",
              estimation.remainingCredits < 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {estimation.remainingCredits.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Warnings */}
        {!estimation.canAfford && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-xs text-destructive">
              <div className="font-medium mb-1">Créditos insuficientes</div>
              <div>
                Você precisa de {(estimation.totalCredits - userCredits).toLocaleString()} créditos adicionais para este envio.
              </div>
            </div>
          </div>
        )}

        {estimation.segmentInfo.segments > 1 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-700 dark:text-amber-300">
              <div className="font-medium mb-1">Mensagem longa</div>
              <div>
                Esta mensagem será enviada em {estimation.segmentInfo.segments} partes, 
                aumentando o custo para {estimation.costPerSms} créditos por destinatário.
              </div>
            </div>
          </div>
        )}

        {/* Credit info */}
        <div className="flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
          <CreditCard className="h-3 w-3" />
          <span>1 crédito = 1 segmento SMS</span>
        </div>
      </CardContent>
    </Card>
  );
}