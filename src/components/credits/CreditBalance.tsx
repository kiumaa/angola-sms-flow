import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";

interface CreditBalanceProps {
  credits: number;
  loading?: boolean;
}

export const CreditBalance = ({ credits, loading }: CreditBalanceProps) => {
  if (loading) {
    return (
      <Card className="glass-card border-primary/20 bg-primary/5 text-center min-w-48 animate-pulse">
        <CardContent className="p-6">
          <div className="h-16 bg-muted/20 rounded-lg"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/20 bg-primary/5 text-center min-w-48 hover:shadow-glow transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-center mb-2">
          <div className="p-3 rounded-full bg-gradient-primary shadow-glow mr-3">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Saldo Atual</p>
            <p className="text-3xl font-light gradient-text">{credits?.toLocaleString() || "0"}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">SMS disponíveis</p>
      </CardContent>
    </Card>
  );
};