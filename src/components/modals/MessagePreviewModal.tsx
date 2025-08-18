import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Send, MessageSquare, Smartphone, Users, CreditCard } from "lucide-react";
import { calculateSMSSegments } from "@/lib/smsUtils";
import { formatPhoneForDisplay } from "@/lib/phoneNormalization";

interface MessagePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  recipients: string[];
  senderId: string;
  creditsEstimated: number;
  onSendNow: () => void;
}

export const MessagePreviewModal = ({
  open,
  onOpenChange,
  message,
  recipients,
  senderId,
  creditsEstimated,
  onSendNow
}: MessagePreviewModalProps) => {
  const segmentInfo = calculateSMSSegments(message);
  const previewRecipients = recipients.slice(0, 5);
  const effectiveSenderId = senderId || 'SMSAO';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Previsualização da Mensagem
          </DialogTitle>
          <DialogDescription>
            Revise sua mensagem antes do envio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Message Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Detalhes da Mensagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Remetente:</span>
                  <Badge variant="outline">{effectiveSenderId}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Codificação:</span>
                  <Badge variant={segmentInfo.encoding === 'GSM7' ? 'default' : 'secondary'}>
                    {segmentInfo.encoding}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Caracteres:</span>
                  <span className="text-sm font-mono">{segmentInfo.totalChars}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Segmentos:</span>
                  <Badge variant="outline">{segmentInfo.segments}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Resumo do Envio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Destinatários:</span>
                  <span className="text-sm font-semibold">{recipients.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">SMS por destinatário:</span>
                  <span className="text-sm">{segmentInfo.segments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total de SMS:</span>
                  <span className="text-sm font-semibold">{recipients.length * segmentInfo.segments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Créditos estimados:</span>
                  <Badge variant="default">
                    <CreditCard className="h-3 w-3 mr-1" />
                    {creditsEstimated}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Conteúdo da Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-2">
                  De: {effectiveSenderId}
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message}
                </div>
                <div className="text-xs text-muted-foreground mt-2 text-right">
                  {segmentInfo.encoding} • {segmentInfo.segments} SMS
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Amostra dos Destinatários</CardTitle>
              <CardDescription>
                Primeiros {previewRecipients.length} de {recipients.length} destinatários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {previewRecipients.map((phone, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-mono text-sm">{formatPhoneForDisplay(phone)}</div>
                        <div className="text-xs text-muted-foreground">
                          Mensagem renderizada (texto bruto)
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {segmentInfo.segments} SMS
                    </Badge>
                  </div>
                ))}
                
                {recipients.length > 5 && (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    ... e mais {recipients.length - 5} destinatários
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Encoding Information */}
          {segmentInfo.encoding === 'UCS2' && (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-white font-bold">!</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Codificação Unicode (UCS2)
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Sua mensagem contém caracteres especiais e será enviada em formato Unicode, 
                      reduzindo o limite de caracteres por SMS.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Voltar e Editar
            </Button>
            <Button onClick={onSendNow} className="flex-1">
              <Send className="h-4 w-4 mr-2" />
              Enviar Agora
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};