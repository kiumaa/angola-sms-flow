import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";

interface Transaction {
  id: string;
  amount_kwanza: number;
  credits_purchased: number;
  status: string;
  payment_method: string;
  payment_reference: string;
  created_at: string;
}

interface TransactionCardProps {
  transaction: Transaction;
}

export const TransactionCard = ({ transaction }: TransactionCardProps) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Concluída", color: "bg-green-500/20 text-green-400 border-green-500/30" },
      pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
      failed: { label: "Falhou", color: "bg-red-500/20 text-red-400 border-red-500/30" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} border rounded-full px-3 py-1`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="flex items-center justify-between p-6 rounded-2xl glass-card border-glass-border hover-lift transition-all duration-300 group">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-gradient-primary shadow-glow group-hover:scale-110 transition-transform duration-300">
          <ShoppingCart className="h-5 w-5 text-white" />
        </div>
        <div>
          <h4 className="font-medium text-base">Pacote de {transaction.credits_purchased.toLocaleString()} SMS</h4>
          <p className="text-sm text-muted-foreground">
            {new Date(transaction.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <div className="flex items-center gap-4">
          <div>
            <p className="font-medium text-green-500 text-base">
              +{transaction.credits_purchased.toLocaleString()} SMS
            </p>
            <p className="text-sm text-muted-foreground">
              {(transaction.amount_kwanza / 1000).toFixed(0)}.000 Kz
            </p>
          </div>
          {getStatusBadge(transaction.status)}
        </div>
      </div>
    </div>
  );
};