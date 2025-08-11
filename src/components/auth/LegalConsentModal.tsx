import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

interface LegalConsentModalProps {
  isOpen: boolean;
  onComplete: () => void;
  userId: string;
  userIp?: string;
}

export function LegalConsentModal({ isOpen, onComplete, userId, userIp }: LegalConsentModalProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    if (!termsAccepted || !privacyAccepted) {
      toast({
        title: "Aceite obrigatório",
        description: "Deve aceitar ambos os termos de uso e política de privacidade",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Get current legal versions
      const { data: settings, error: settingsError } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['LEGAL_TERMS_VERSION', 'LEGAL_PRIVACY_VERSION']);

      if (settingsError) {
        throw settingsError;
      }

      const termsVersion = settings?.find(s => s.key === 'LEGAL_TERMS_VERSION')?.value || '1.0';
      const privacyVersion = settings?.find(s => s.key === 'LEGAL_PRIVACY_VERSION')?.value || '1.0';

      // Record consent for terms and privacy
      const consents = [
        {
          user_id: userId,
          document: 'terms' as const,
          version: termsVersion,
          ip_address: userIp
        },
        {
          user_id: userId,
          document: 'privacy' as const,
          version: privacyVersion,
          ip_address: userIp
        }
      ];

      const { error: consentError } = await supabase
        .from('user_consents')
        .insert(consents);

      if (consentError) {
        throw consentError;
      }

      toast({
        title: "Consentimento registrado",
        description: "Termos de uso e política de privacidade aceitos com sucesso",
      });

      onComplete();
    } catch (error) {
      console.error('Error recording consent:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar consentimento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Termos Legais - Aceite Obrigatório</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resumo dos Termos de Uso</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Ao usar o SMS AO, você concorda em não enviar SPAM ou conteúdo ilegal</p>
                <p>• O sistema funciona com créditos pré-pagos que não são reembolsáveis</p>
                <p>• Você é responsável por manter suas credenciais seguras</p>
                <p>• Podemos suspender contas que violem nossos termos</p>
              </div>
              <a 
                href="/legal/terms" 
                target="_blank" 
                className="text-primary hover:underline text-sm"
              >
                Ler Termos de Uso completos →
              </a>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resumo da Política de Privacidade</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Coletamos apenas dados necessários para fornecer nossos serviços</p>
                <p>• Não vendemos ou compartilhamos seus dados com terceiros</p>
                <p>• Seus dados são protegidos com criptografia e medidas de segurança</p>
                <p>• Você tem direito de acessar, corrigir ou excluir seus dados</p>
              </div>
              <a 
                href="/legal/privacy" 
                target="_blank" 
                className="text-primary hover:underline text-sm"
              >
                Ler Política de Privacidade completa →
              </a>
            </div>
          </div>
        </ScrollArea>

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="terms" 
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            />
            <label 
              htmlFor="terms" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Li e concordo com os Termos de Uso
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="privacy" 
              checked={privacyAccepted}
              onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
            />
            <label 
              htmlFor="privacy" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Li e concordo com a Política de Privacidade
            </label>
          </div>

          <Button 
            onClick={handleAccept}
            disabled={!termsAccepted || !privacyAccepted || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <LoadingSpinner />
                Processando...
              </>
            ) : (
              'Aceitar e Continuar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}