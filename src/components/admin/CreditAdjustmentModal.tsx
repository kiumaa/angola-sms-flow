import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Minus } from "lucide-react";

interface CreditAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    full_name: string;
    credits: number;
  } | null;
  onAdjustCredits: (userId: string, delta: number, reason: string, type?: 'manual' | 'bonus' | 'refund') => Promise<void>;
}

const CreditAdjustmentModal = ({ open, onOpenChange, user, onAdjustCredits }: CreditAdjustmentModalProps) => {
  const [operation, setOperation] = useState<'add' | 'subtract' | 'set'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'manual' | 'bonus' | 'refund'>('manual');
  const [isLoading, setIsLoading] = useState(false);

  const calculateNewBalance = () => {
    if (!user || !amount) return user?.credits || 0;
    
    const value = parseInt(amount);
    if (isNaN(value)) return user.credits;
    
    switch (operation) {
      case 'add':
        return user.credits + value;
      case 'subtract':
        return Math.max(0, user.credits - value);
      case 'set':
        return Math.max(0, value);
      default:
        return user.credits;
    }
  };

  const calculateDelta = () => {
    if (!user || !amount) return 0;
    
    const value = parseInt(amount);
    if (isNaN(value)) return 0;
    
    switch (operation) {
      case 'add':
        return value;
      case 'subtract':
        return -value;
      case 'set':
        return Math.max(0, value) - user.credits;
      default:
        return 0;
    }
  };

  const handleSubmit = async () => {
    if (!user || !amount || !reason.trim()) return;
    
    setIsLoading(true);
    try {
      const delta = calculateDelta();
      await onAdjustCredits(user.id, delta, reason.trim(), adjustmentType);
      
      // Reset form
      setAmount('');
      setReason('');
      setOperation('add');
      setAdjustmentType('manual');
      onOpenChange(false);
    } catch (error) {
      console.error('Error adjusting credits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const newBalance = calculateNewBalance();
  const delta = calculateDelta();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Ajustar Créditos</DialogTitle>
          <DialogDescription>
            {user && `Gerenciar créditos para ${user.full_name}`}
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="space-y-4">
            {/* Current Balance */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Saldo atual</div>
              <div className="text-2xl font-bold">{user.credits} créditos</div>
            </div>

            {/* Operation Type */}
            <div className="space-y-2">
              <Label>Operação</Label>
              <Select value={operation} onValueChange={(value: 'add' | 'subtract' | 'set') => setOperation(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4 text-green-600" />
                      <span>Adicionar</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="subtract">
                    <div className="flex items-center space-x-2">
                      <Minus className="h-4 w-4 text-red-600" />
                      <span>Subtrair</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="set">
                    <span>Definir valor absoluto</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>
                {operation === 'set' ? 'Novo saldo' : 'Quantidade'}
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                max="10000"
              />
            </div>

            {/* Adjustment Type */}
            <div className="space-y-2">
              <Label>Tipo de Ajuste</Label>
              <Select value={adjustmentType} onValueChange={(value: 'manual' | 'bonus' | 'refund') => setAdjustmentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="bonus">Bônus</SelectItem>
                  <SelectItem value="refund">Reembolso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Textarea
                placeholder="Descreva o motivo do ajuste..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* Preview */}
            {amount && (
              <div className="p-3 border rounded-lg bg-accent/10">
                <div className="text-sm font-medium mb-2">Prévia da alteração:</div>
                <div className="flex items-center justify-between text-sm">
                  <span>Saldo atual:</span>
                  <span>{user.credits} créditos</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Alteração:</span>
                  <Badge variant={delta >= 0 ? "default" : "destructive"}>
                    {delta >= 0 ? '+' : ''}{delta} créditos
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm font-medium border-t pt-2 mt-2">
                  <span>Novo saldo:</span>
                  <span>{newBalance} créditos</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !amount || !reason.trim() || newBalance < 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Confirmar Ajuste"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreditAdjustmentModal;