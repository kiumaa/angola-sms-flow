import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Construction, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ComingSoonProps {
  title: string;
  description: string;
  showBackButton?: boolean;
}

export const ComingSoon = ({ title, description, showBackButton = true }: ComingSoonProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="card-futuristic max-w-md w-full mx-4">
        <CardContent className="text-center py-16 px-8">
          <div className="p-6 rounded-3xl bg-gradient-primary/10 w-fit mx-auto mb-6">
            <Construction className="h-12 w-12 text-primary mx-auto" />
          </div>
          <h1 className="text-3xl font-light gradient-text mb-4">{title}</h1>
          <p className="text-muted-foreground text-lg mb-2">Brevemente</p>
          <p className="text-muted-foreground mb-8">
            {description}
          </p>
          {showBackButton && (
            <Button 
              onClick={() => navigate(-1)}
              variant="outline" 
              className="glass-card border-glass-border"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};