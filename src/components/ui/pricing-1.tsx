import { CheckIcon, ArrowRight, Zap } from "lucide-react";
import React from "react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { usePackages } from "@/hooks/usePackages";
import { useNavigate } from "react-router-dom";

const Pricing1 = () => {
  const { packages, loading } = usePackages();
  const navigate = useNavigate();

  const handlePurchase = (packageId: string) => {
    navigate(`/checkout/${packageId}`);
  };

  if (loading) {
    return (
      <section className="flex flex-col items-center justify-center gap-20 w-[95%] mx-auto py-20 bg-background text-foreground">
        <div className="flex flex-col items-center gap-7 w-full">
          <h2 className="font-medium text-2xl leading-6 text-center">
            Carregando pacotes...
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  // Sort packages by credits and mark middle one as popular (hook already filters valid packages)
  const sortedPackages = [...packages].sort((a, b) => a.credits - b.credits);
  const middleIndex = Math.floor(sortedPackages.length / 2);
  
  console.log('Packages received from hook:', packages.length, packages);
  
  // Show empty state if no packages after hook filtering
  if (!loading && packages.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center gap-20 w-[95%] mx-auto py-20 bg-background text-foreground">
        <div className="flex flex-col items-center gap-7 w-full">
          <h2 className="font-medium text-2xl leading-6 text-center">
            Pacotes de Créditos SMS
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl">
            Nenhum pacote disponível no momento. Entre em contato conosco.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center justify-center gap-20 w-[95%] mx-auto py-20 bg-background text-foreground">
      <div className="flex flex-col items-center gap-7 w-full">
        <h2 className="font-medium text-2xl leading-6 text-center">
          Pacotes de Créditos SMS
        </h2>
        <p className="text-muted-foreground text-center max-w-2xl">
          Escolha o pacote ideal para suas necessidades de comunicação empresarial
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
        {sortedPackages.map((pkg, index) => {
          const isPopular = index === middleIndex;
          const pricePerSMS = pkg.credits > 0 && pkg.price_kwanza > 0 
            ? (pkg.price_kwanza / pkg.credits).toFixed(2)
            : "0.00";
          
          return (
            <Card
              key={pkg.id}
              className={`glass-card relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-glow ${
                isPopular 
                  ? 'border-primary ring-2 ring-primary/20 shadow-glow' 
                  : 'border-border hover:border-primary/30'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Mais Popular
                  </div>
                </div>
              )}
              
              <CardContent className="p-8 h-full flex flex-col">
                <div className="flex flex-col gap-6 flex-grow">
                  <div className="text-center">
                    <h3 className="font-medium text-xl mb-2">{pkg.name}</h3>
                    {pkg.description && (
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {pkg.description}
                      </p>
                    )}
                  </div>

                  <div className="text-center">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-semibold">
                        {pkg.price_kwanza.toLocaleString('pt-AO')}
                      </span>
                      <span className="text-muted-foreground text-sm">Kz</span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                      {pkg.credits.toLocaleString()} créditos SMS
                    </p>
                    <p className="text-muted-foreground text-xs">
                      ~{pricePerSMS} Kz por SMS
                    </p>
                  </div>

                  <div className="border-t border-border pt-6">
                    <div className="space-y-3">
                      {[
                        `${pkg.credits.toLocaleString()} créditos SMS`,
                        "Dashboard completo",
                        "Suporte técnico",
                        "Relatórios detalhados",
                        "Envio programado",
                        "Gestão de contactos"
                      ].map((feature, featureIndex) => (
                        <div
                          key={featureIndex}
                          className="flex items-center gap-3"
                        >
                          <CheckIcon className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border mt-6">
                  <Button
                    onClick={() => handlePurchase(pkg.id)}
                    className={`w-full transition-all duration-300 group ${
                      isPopular
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
                    }`}
                    size="lg"
                  >
                    Escolher Pacote
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="text-center max-w-2xl">
        <p className="text-muted-foreground text-sm">
          Todos os pacotes incluem acesso completo à plataforma, sem taxas ocultas. 
          Créditos não utilizados nunca expiram.
        </p>
      </div>
    </section>
  );
};

export { Pricing1 };