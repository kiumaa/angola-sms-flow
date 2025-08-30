import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Check, Zap, Clock, Shield, Calculator } from "lucide-react";
import { motion } from "motion/react";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_kwanza: number;
}

interface EnhancedOrderSummaryProps {
  selectedPackage: CreditPackage;
  userCredits?: number;
}

export const EnhancedOrderSummary = ({ selectedPackage, userCredits = 0 }: EnhancedOrderSummaryProps) => {
  const pricePerSMS = selectedPackage.price_kwanza / selectedPackage.credits / 100;
  const economyPercentage = 15; // Simulação de economia
  const validityDays = 120;
  
  // Calcular progresso do saldo atual
  const currentProgress = Math.min((userCredits / selectedPackage.credits) * 100, 100);
  const futureProgress = Math.min(((userCredits + selectedPackage.credits) / (selectedPackage.credits * 2)) * 100, 100);

  const benefits = [
    { icon: Zap, text: "Envio instantâneo de SMS", highlight: true },
    { icon: Shield, text: "Garantia de entrega 99.9%", highlight: false },
    { icon: Clock, text: `Validade de ${validityDays} dias`, highlight: false },
    { icon: Calculator, text: "Relatórios detalhados inclusos", highlight: false }
  ];

  return (
    <Card className="card-futuristic">
      <CardHeader>
        <CardTitle className="gradient-text flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Resumo do Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Package Overview */}
        <motion.div 
          className="p-6 rounded-2xl glass-card border-glass-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-medium">{selectedPackage.name}</h3>
            <Badge className="bg-gradient-primary text-white shadow-glow">
              Mais Popular
            </Badge>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">SMS incluídos:</span>
              <span className="font-medium text-lg">
                {selectedPackage.credits.toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Credit Balance Progress */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h4 className="font-medium">Evolução do Saldo</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Saldo atual: {userCredits.toLocaleString()}</span>
              <span>Após compra: {(userCredits + selectedPackage.credits).toLocaleString()}</span>
            </div>
            <div className="relative">
              <Progress value={currentProgress} className="h-2" />
              <Progress 
                value={futureProgress} 
                className="h-2 absolute inset-0 opacity-50" 
              />
            </div>
          </div>
        </motion.div>

        <Separator />

        {/* Pricing Breakdown */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{(selectedPackage.price_kwanza / 1000).toFixed(0)}.000 Kz</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Taxa de processamento:</span>
            <span className="text-green-500">Grátis</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Desconto ({economyPercentage}%):</span>
            <span className="text-green-500">
              -{((selectedPackage.price_kwanza * economyPercentage / 100) / 1000).toFixed(0)}.000 Kz
            </span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span className="gradient-text text-xl">
              {(selectedPackage.price_kwanza / 1000).toFixed(0)}.000 Kz
            </span>
          </div>
        </motion.div>

        {/* Economy Highlight */}
        <motion.div 
          className="flex items-start gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-green-500">
              Economia de {economyPercentage}%
            </p>
            <p className="text-muted-foreground">
              Comparado a compras menores • Melhor custo-benefício
            </p>
          </div>
        </motion.div>

        {/* Benefits List */}
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h4 className="font-medium">Incluído no seu pacote:</h4>
          <div className="space-y-2">
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
              >
                <benefit.icon 
                  className={`h-4 w-4 ${benefit.highlight ? 'text-primary' : 'text-muted-foreground'}`} 
                />
                <span className={`text-sm ${benefit.highlight ? 'font-medium' : 'text-muted-foreground'}`}>
                  {benefit.text}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
};