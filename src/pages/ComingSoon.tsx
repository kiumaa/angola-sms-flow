import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, MessageSquare, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/useDynamicMetaTags";


const ComingSoon = () => {
  usePageMeta({
    title: 'Campanhas - Em Breve',
    description: 'Funcionalidade de campanhas em desenvolvimento. Use o Envio Rápido para suas necessidades atuais.'
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary/10 rounded-full">
            <MessageSquare className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4 text-foreground">
          Campanhas em Desenvolvimento
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Estamos trabalhando numa funcionalidade completa de campanhas. 
          Por enquanto, use o Envio Rápido para suas necessidades de SMS.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle>Envio Rápido</CardTitle>
            </div>
            <CardDescription>
              Envie SMS para um ou múltiplos contactos instantaneamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Use nossa funcionalidade de envio rápido para suas necessidades imediatas de SMS.
              Suporta envio individual ou em massa.
            </p>
            <Button asChild className="w-full">
              <Link to="/quick-send">
                Acessar Envio Rápido
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Campanhas (Em Breve)</CardTitle>
            </div>
            <CardDescription>
              Funcionalidade avançada de campanhas programadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Em breve você poderá criar campanhas programadas, segmentação avançada 
              e automações de envio.
            </p>
            <Button disabled variant="outline" className="w-full">
              Em Desenvolvimento
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/20 border-border/50">
        <CardHeader>
          <CardTitle className="text-center">O que estará disponível em Campanhas?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Funcionalidades Planejadas:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Programação de envios</li>
                <li>• Segmentação avançada</li>
                <li>• Templates personalizados</li>
                <li>• Automação de workflows</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Relatórios Avançados:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Métricas de performance</li>
                <li>• Taxa de entrega detalhada</li>
                <li>• Análise de engajamento</li>
                <li>• Relatórios personalizados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoon;