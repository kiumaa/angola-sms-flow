import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, Wallet, QrCode, Smartphone, Hash } from "lucide-react";

interface EkwanzaStatsCardsProps {
  stats: {
    pending: number;
    paid: number;
    expired: number;
    cancelled: number;
    total: number;
    totalAmount: number;
    qrcode: number;
    mcx: number;
    referencia: number;
  };
}

export const EkwanzaStatsCards = ({ stats }: EkwanzaStatsCardsProps) => {
  return (
    <>
      {/* Primary Stats */}
      <div className="grid md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Pendentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Pagos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.paid}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <XCircle className="h-4 w-4" />
              <span>Expirados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">
              {stats.expired}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <XCircle className="h-4 w-4" />
              <span>Cancelados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.cancelled}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <Wallet className="h-4 w-4" />
              <span>Total Processado</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalAmount.toLocaleString()} Kz
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Method Breakdown */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <QrCode className="h-4 w-4" />
              <span>QR Code</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.qrcode}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.qrcode / stats.total) * 100 || 0).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <Smartphone className="h-4 w-4" />
              <span>Multicaixa Express</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.mcx}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.mcx / stats.total) * 100 || 0).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
              <Hash className="h-4 w-4" />
              <span>Referência EMIS</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.referencia}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((stats.referencia / stats.total) * 100 || 0).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
