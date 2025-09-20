import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PackageDiscount, usePackageDiscounts } from "@/hooks/usePackageDiscounts";

interface DiscountModalProps {
  packageId: string;
  packageName: string;
  existingDiscount?: PackageDiscount;
  trigger?: React.ReactNode;
}

export const DiscountModal = ({ packageId, packageName, existingDiscount, trigger }: DiscountModalProps) => {
  const [open, setOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>(
    existingDiscount?.discount_type || 'percentage'
  );
  const [discountValue, setDiscountValue] = useState(
    existingDiscount?.discount_type === 'percentage' 
      ? existingDiscount.discount_percentage.toString()
      : existingDiscount?.discount_value.toString() || ''
  );
  const [isActive, setIsActive] = useState(existingDiscount?.is_active || false);
  const [validFrom, setValidFrom] = useState<Date | undefined>(
    existingDiscount ? new Date(existingDiscount.valid_from) : new Date()
  );
  const [validUntil, setValidUntil] = useState<Date | undefined>(
    existingDiscount?.valid_until ? new Date(existingDiscount.valid_until) : undefined
  );
  const [description, setDescription] = useState(existingDiscount?.description || '');
  const [loading, setLoading] = useState(false);

  const { createDiscount, updateDiscount } = usePackageDiscounts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountValue || !validFrom) return;

    setLoading(true);

    try {
      const discountData = {
        package_id: packageId,
        discount_type: discountType,
        discount_percentage: discountType === 'percentage' ? parseFloat(discountValue) : 0,
        discount_value: discountType === 'fixed_amount' ? parseFloat(discountValue) : 0,
        is_active: isActive,
        valid_from: validFrom.toISOString(),
        valid_until: validUntil?.toISOString(),
        description: description.trim() || undefined,
      };

      if (existingDiscount) {
        await updateDiscount(existingDiscount.id, discountData);
      } else {
        await createDiscount(discountData);
      }

      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar desconto:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDiscountType('percentage');
    setDiscountValue('');
    setIsActive(false);
    setValidFrom(new Date());
    setValidUntil(undefined);
    setDescription('');
  };

  const defaultTrigger = existingDiscount ? (
    <Button variant="outline" size="sm">
      <Edit className="h-4 w-4 mr-2" />
      Editar Desconto
    </Button>
  ) : (
    <Button variant="outline" size="sm">
      <Plus className="h-4 w-4 mr-2" />
      Criar Desconto
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingDiscount ? 'Editar' : 'Criar'} Desconto - {packageName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="discount-type">Tipo de Desconto</Label>
            <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed_amount') => setDiscountType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentagem (%)</SelectItem>
                <SelectItem value="fixed_amount">Valor Fixo (AOA)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount-value">
              {discountType === 'percentage' ? 'Percentagem de Desconto' : 'Valor do Desconto (AOA)'}
            </Label>
            <Input
              id="discount-value"
              type="number"
              step={discountType === 'percentage' ? '0.01' : '1'}
              max={discountType === 'percentage' ? '100' : undefined}
              min="0"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === 'percentage' ? '15.00' : '1000'}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Promoção de fim de ano"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validFrom ? format(validFrom, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={validFrom}
                    onSelect={setValidFrom}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Fim (opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validUntil ? format(validUntil, "dd/MM/yyyy", { locale: ptBR }) : "Sem data fim"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={validUntil}
                    onSelect={setValidUntil}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is-active">Desconto Ativo</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (existingDiscount ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};