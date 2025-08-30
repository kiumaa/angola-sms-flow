import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useUserCredits } from '@/hooks/useUserCredits';
import { cn } from '@/lib/utils';

interface WhatsAppSupportButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showText?: boolean;
}

export const WhatsAppSupportButton = ({ 
  variant = 'outline', 
  size = 'sm',
  className,
  showText = false 
}: WhatsAppSupportButtonProps) => {
  const { user } = useAuth();
  const { credits } = useUserCredits();

  const handleWhatsAppSupport = () => {
    const userName = user?.email?.split('@')[0] || 'Usuário';
    const userEmail = user?.email || '';
    const whatsappNumber = '244923456789'; // Número configurável
    
    const message = encodeURIComponent(
      `Olá! Sou ${userName} (${userEmail}) e preciso de suporte com minha conta SMS AO. Atualmente tenho ${credits} créditos.`
    );
    
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleWhatsAppSupport}
      className={cn(
        "text-[#25D366] border-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors",
        className
      )}
      title="Suporte via WhatsApp"
    >
      <MessageCircle className="h-4 w-4" />
      {showText && <span className="ml-2">Suporte</span>}
    </Button>
  );
};