import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, MessageSquare, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AnalyticsEmptyState = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mb-6 p-6 bg-muted/20 rounded-full">
          <BarChart3 className="h-16 w-16 text-muted-foreground" />
        </div>
        
        <h3 className="text-2xl font-semibold mb-3">Nenhum dado de SMS ainda</h3>
        
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          Seus analytics aparecerão aqui assim que você começar a enviar campanhas de SMS. 
          Comece agora e acompanhe métricas em tempo real!
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => navigate("/admin/sms-test")}
            size="lg"
            className="gap-2"
          >
            <MessageSquare className="h-5 w-5" />
            Enviar SMS Teste
          </Button>
          
          <Button 
            onClick={() => navigate("/admin/campaigns")}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <TrendingUp className="h-5 w-5" />
            Criar Campanha
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t w-full max-w-md">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Dica:</strong> Configure seus gateways SMS em{" "}
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => navigate("/admin/sms-gateways")}
            >
              Configurações de Gateway
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
