import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLegalConsent, ConsentRecord } from "@/hooks/useLegalConsent";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export function ConsentHistory() {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { getUserConsents } = useLegalConsent();

  useEffect(() => {
    const loadConsents = async () => {
      try {
        const userConsents = await getUserConsents();
        setConsents(userConsents);
      } catch (error) {
        console.error('Error loading consent history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConsents();
  }, [getUserConsents]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Consentimentos</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  const getDocumentLabel = (document: string) => {
    switch (document) {
      case 'terms':
        return 'Termos de Uso';
      case 'privacy':
        return 'Política de Privacidade';
      default:
        return document;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Consentimentos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Registro dos seus aceites de termos legais e políticas
        </p>
      </CardHeader>
      <CardContent>
        {consents.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhum consentimento registrado
          </p>
        ) : (
          <div className="space-y-4">
            {consents.map((consent) => (
              <div 
                key={consent.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {getDocumentLabel(consent.document)}
                    </span>
                    <Badge variant="secondary">
                      v{consent.version}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Aceito em {format(new Date(consent.accepted_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                  {consent.ip_address && (
                    <p className="text-xs text-muted-foreground">
                      IP: {consent.ip_address}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}