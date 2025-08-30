import { Check, CreditCard, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutProgressStepsProps {
  currentStep: 1 | 2 | 3;
  className?: string;
}

export const CheckoutProgressSteps = ({ currentStep, className }: CheckoutProgressStepsProps) => {
  const steps = [
    { id: 1, title: "Seleção", icon: ShoppingCart, description: "Escolher pacote" },
    { id: 2, title: "Pagamento", icon: CreditCard, description: "Confirmar dados" },
    { id: 3, title: "Confirmação", icon: Check, description: "Finalizado" }
  ];

  return (
    <div className={cn("flex items-center justify-center space-x-8", className)}>
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;
        const isUpcoming = currentStep < step.id;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center space-y-2">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 relative",
                  {
                    "bg-gradient-primary shadow-glow": isCompleted || isCurrent,
                    "bg-muted": isUpcoming,
                  }
                )}
              >
                {isCompleted ? (
                  <Check className="h-6 w-6 text-white animate-scale-in" />
                ) : (
                  <step.icon 
                    className={cn(
                      "h-6 w-6 transition-colors duration-300",
                      {
                        "text-white": isCurrent,
                        "text-muted-foreground": isUpcoming,
                      }
                    )} 
                  />
                )}
                
                {/* Pulse animation for current step */}
                {isCurrent && (
                  <div className="absolute inset-0 rounded-full bg-primary opacity-75 animate-ping" />
                )}
              </div>
              
              <div className="text-center">
                <div 
                  className={cn(
                    "text-sm font-medium transition-colors duration-300",
                    {
                      "text-primary": isCompleted || isCurrent,
                      "text-muted-foreground": isUpcoming,
                    }
                  )}
                >
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {step.description}
                </div>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-px mx-6 relative">
                <div className="absolute inset-0 bg-muted" />
                <div 
                  className={cn(
                    "absolute inset-0 bg-gradient-primary transition-all duration-700 ease-out",
                    isCompleted ? "scale-x-100" : "scale-x-0"
                  )}
                  style={{ transformOrigin: "left" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};