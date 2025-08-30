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
    const whatsappNumber = '244933493788'; // KB Agency WhatsApp
    
    const message = encodeURIComponent(
      `Olá! Sou ${userName} (${userEmail}) da plataforma SMS AO e preciso de suporte técnico com minha conta.

📊 Informações da Conta:
• Email: ${userEmail}
• Créditos disponíveis: ${credits}

💬 Como posso ajudar com sua dúvida sobre envio de SMS, configurações ou funcionalidades da plataforma?

Aguardo seu retorno para dar suporte rápido e eficiente! 🚀`
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