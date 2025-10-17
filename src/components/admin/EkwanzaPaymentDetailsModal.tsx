import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Copy, X, QrCode, Smartphone, Hash, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EkwanzaPaymentDetailsModalProps {
  payment: {
    id: string;
    user_id: string;
    transaction_id: string;
    payment_method: string;
    amount: number;
    status: string;
    reference_code: string;
    ekwanza_code: string | null;
    ekwanza_operation_code: string | null;
    mobile_number: string | null;
    qr_code_base64: string | null;
    reference_number: string | null;
    expiration_date: string | null;
    created_at: string;
    updated_at: string;
    paid_at: string | null;
    raw_response: any;
    raw_callback: any;
    callback_received_at: string | null;
    transactions: {
      id: string;
      credits_purchased: number;
      credit_packages: {
        name: string;
      } | null;
    };
    profiles: {
      full_name: string;
      email: string;
      company_name: string;
    } | null;
  };
  onClose: () => void;
  onCheckStatus: (payment: any) => void;
  onCancel: (payment: any) => void;
}

export const EkwanzaPaymentDetailsModal = ({ 
  payment, 
  onClose, 
  onCheckStatus, 
  onCancel 
}: EkwanzaPaymentDetailsModalProps) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const getMethodIcon = (method: string) => {
    const icons = {
      qrcode: <QrCode className="h-4 w-4" />,
      mcx: <Smartphone className="h-4 w-4" />,
      referencia: <Hash className="h-4 w-4" />
    };
    return icons[method as keyof typeof icons] || <QrCode className="h-4 w-4" />;
  };

  const getMethodLabel = (method: string) => {
    const labels = {
      qrcode: 'QR Code',
      mcx: 'Multicaixa Express',
      referencia: 'Referência EMIS'
    };
    return labels[method as keyof typeof labels] || method;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      paid: 'default',
      expired: 'outline',
      cancelled: 'destructive'
    };

    const labels = {
      pending: 'Pendente',
      paid: 'Pago',
      expired: 'Expirado',
      cancelled: 'Cancelado'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Detalhes do Pagamento É-kwanza</span>
            {getStatusBadge(payment.status)}
          </DialogTitle>
          <DialogDescription>
            Informações completas do pagamento
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* User Info */}
            <div>
              <h3 className="font-semibold mb-3">Informações do Cliente</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome Completo</Label>
                  <p className="font-medium">{payment.profiles?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="font-medium">{payment.profiles?.email}</p>
                </div>
                <div>
                  <Label>Empresa</Label>
                  <p className="font-medium">{payment.profiles?.company_name || 'N/A'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Payment Info */}
            <div>
              <h3 className="font-semibold mb-3">Informações do Pagamento</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Valor</Label>
                  <p className="font-medium text-lg">{payment.amount.toLocaleString()} Kz</p>
                </div>
                <div>
                  <Label>Créditos SMS</Label>
                  <p className="font-medium text-lg">{payment.transactions.credits_purchased}</p>
                </div>
                <div>
                  <Label>Pacote</Label>
                  <p className="font-medium">{payment.transactions.credit_packages?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label>Método de Pagamento</Label>
                  <div className="flex items-center space-x-2">
                    {getMethodIcon(payment.payment_method)}
                    <span className="font-medium">{getMethodLabel(payment.payment_method)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* É-kwanza Details */}
            <div>
              <h3 className="font-semibold mb-3">Detalhes É-kwanza</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Código É-kwanza</Label>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono text-sm">{payment.ekwanza_code || 'N/A'}</p>
                    {payment.ekwanza_code && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(payment.ekwanza_code!, 'Código')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Código de Operação</Label>
                  <p className="font-mono text-sm">{payment.ekwanza_operation_code || 'N/A'}</p>
                </div>
                <div>
                  <Label>Código de Referência</Label>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono text-sm">{payment.reference_code}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(payment.reference_code, 'Referência')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {payment.reference_number && (
                  <div>
                    <Label>Número de Referência EMIS</Label>
                    <div className="flex items-center space-x-2">
                      <p className="font-mono text-sm">{payment.reference_number}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(payment.reference_number!, 'Número de Referência')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                {payment.mobile_number && (
                  <div>
                    <Label>Número de Celular</Label>
                    <p className="font-medium">{payment.mobile_number}</p>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code */}
            {payment.qr_code_base64 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">QR Code</h3>
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img 
                      src={`data:image/png;base64,${payment.qr_code_base64}`}
                      alt="QR Code de Pagamento"
                      className="max-w-xs"
                    />
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Timestamps */}
            <div>
              <h3 className="font-semibold mb-3">Datas</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Criado em</Label>
                  <p className="font-medium">
                    {new Date(payment.created_at).toLocaleString('pt-AO')}
                  </p>
                </div>
                <div>
                  <Label>Atualizado em</Label>
                  <p className="font-medium">
                    {new Date(payment.updated_at).toLocaleString('pt-AO')}
                  </p>
                </div>
                {payment.expiration_date && (
                  <div>
                    <Label>Data de Expiração</Label>
                    <p className="font-medium text-red-600">
                      {new Date(payment.expiration_date).toLocaleString('pt-AO')}
                    </p>
                  </div>
                )}
                {payment.paid_at && (
                  <div>
                    <Label>Pago em</Label>
                    <p className="font-medium text-green-600">
                      {new Date(payment.paid_at).toLocaleString('pt-AO')}
                    </p>
                  </div>
                )}
                {payment.callback_received_at && (
                  <div>
                    <Label>Callback Recebido em</Label>
                    <p className="font-medium">
                      {new Date(payment.callback_received_at).toLocaleString('pt-AO')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* IDs */}
            <div>
              <h3 className="font-semibold mb-3">Identificadores</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <Label>ID do Pagamento</Label>
                  <p className="font-mono text-xs">{payment.id}</p>
                </div>
                <div>
                  <Label>ID da Transação</Label>
                  <p className="font-mono text-xs">{payment.transaction_id}</p>
                </div>
                <div>
                  <Label>ID do Usuário</Label>
                  <p className="font-mono text-xs">{payment.user_id}</p>
                </div>
              </div>
            </div>

            {/* Raw Data */}
            {payment.raw_response && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Resposta da API É-kwanza</h3>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(payment.raw_response, null, 2)}
                  </pre>
                </div>
              </>
            )}

            {payment.raw_callback && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Callback Recebido</h3>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(payment.raw_callback, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          
          {payment.status === 'pending' && (
            <>
              <Button
                variant="default"
                onClick={() => {
                  onCheckStatus(payment);
                  onClose();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Status
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onCancel(payment);
                  onClose();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar Pagamento
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
