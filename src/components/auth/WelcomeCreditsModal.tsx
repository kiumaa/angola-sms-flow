import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

interface WelcomeCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const WelcomeCreditsModal: React.FC<WelcomeCreditsModalProps> = ({
  isOpen,
  onClose,
  userEmail
}) => {
  React.useEffect(() => {
    if (isOpen) {
      // Trigger confetti animation when modal opens
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 shadow-2xl">
        <div className="text-center space-y-6 p-6">
          {/* Header with Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-primary/10 p-4 rounded-full">
                <Gift className="w-12 h-12 text-primary animate-bounce" />
              </div>
            </div>
          </div>

          {/* Title and Message */}
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">
              Bem-vindo à SMS AO! 🎉
            </h2>
            <p className="text-muted-foreground">
              Parabéns, {userEmail ? `${userEmail.split('@')[0]}` : 'novo utilizador'}! 
              A sua conta foi criada com sucesso.
            </p>
          </div>

          {/* Credits Gift */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 border border-primary/20">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <span className="text-lg font-semibold text-foreground">
                5 Créditos Grátis
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Oferecemos 5 créditos gratuitos para começar a enviar SMS imediatamente. 
              Cada crédito permite enviar 1 SMS para qualquer operadora em Angola.
            </p>
            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
              💡 <strong>Dica:</strong> Use os créditos para testar a plataforma e ver como é fácil comunicar com os seus clientes!
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button asChild className="w-full h-12 text-base font-semibold">
              <Link to="/quick-send" onClick={onClose}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Enviar Primeiro SMS
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full text-sm"
            >
              Explorar Dashboard
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-muted-foreground">
            Os créditos foram automaticamente adicionados à sua conta. 
            Pode verificar o saldo no seu dashboard.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};