import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

interface CreditPackage {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  price_kwanza: number;
  is_active: boolean;
}

interface PricingCardProps {
  pkg: CreditPackage;
  index: number;
  onPurchase: (packageId: string) => void;
  isPopular?: boolean;
}

export const PricingCard = ({ pkg, index, onPurchase, isPopular = false }: PricingCardProps) => {
  return (
    <Card 
      className={`relative group transition-all duration-500 hover:scale-105 rounded-3xl overflow-hidden animate-slide-up-stagger glass-card ${
        isPopular ? 'border-2 border-primary shadow-glow scale-105' : 'border-glass-border'
      }`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {isPopular && (
        <>
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-primary text-white rounded-full px-4 py-2 shadow-glow text-sm font-medium">
              ⭐ Mais Popular
            </Badge>
          </div>
        </>
      )}
      
      <CardHeader className="text-center pb-6 pt-8 relative">
        <CardTitle className="gradient-text font-medium text-xl mb-4">{pkg.name}</CardTitle>
        <div className="space-y-2">
          <div className="flex items-baseline justify-center">
            <span className="text-5xl font-light gradient-text">
              {(pkg.price_kwanza / 1000).toFixed(0)}
            </span>
            <span className="text-2xl gradient-text">.000</span>
            <span className="text-muted-foreground text-lg ml-1">Kz</span>
          </div>
          <CardDescription className="text-base">
            {pkg.description || `${pkg.credits.toLocaleString()} SMS incluídos`}
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 pb-8 relative">
        <div className="space-y-6">
          <ul className="space-y-3">
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{pkg.credits.toLocaleString()} SMS incluídos</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Dashboard completo</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Suporte prioritário</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Relatórios detalhados</span>
            </li>
          </ul>
          
          <Button 
            onClick={() => onPurchase(pkg.id)}
            className={`w-full rounded-full transition-all duration-300 hover:scale-105 text-base py-6 font-medium ${
              isPopular 
                ? 'bg-gradient-primary hover:opacity-90 shadow-glow' 
                : 'button-futuristic'
            }`}
            size="lg"
          >
            Escolher Pacote
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};