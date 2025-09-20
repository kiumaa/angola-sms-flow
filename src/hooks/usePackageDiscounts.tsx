import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PackageDiscount {
  id: string;
  package_id: string;
  discount_percentage: number;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  is_active: boolean;
  valid_from: string;
  valid_until?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const usePackageDiscounts = () => {
  const [discounts, setDiscounts] = useState<PackageDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from('package_discounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar descontos:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar descontos",
          variant: "destructive",
        });
        return;
      }

      setDiscounts((data || []) as PackageDiscount[]);
    } catch (error) {
      console.error('Erro ao buscar descontos:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar descontos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const getActiveDiscountForPackage = (packageId: string): PackageDiscount | null => {
    const now = new Date();
    return discounts.find(discount => 
      discount.package_id === packageId &&
      discount.is_active &&
      new Date(discount.valid_from) <= now &&
      (!discount.valid_until || new Date(discount.valid_until) > now)
    ) || null;
  };

  const calculateDiscountedPrice = (originalPrice: number, discount: PackageDiscount | null): number => {
    if (!discount) return originalPrice;

    if (discount.discount_type === 'percentage') {
      return originalPrice - (originalPrice * discount.discount_percentage / 100);
    } else {
      return Math.max(0, originalPrice - discount.discount_value);
    }
  };

  const createDiscount = async (discountData: Omit<PackageDiscount, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('package_discounts')
        .insert([discountData])
        .select()
        .single();

      if (error) throw error;

      await fetchDiscounts();
      toast({
        title: "Sucesso",
        description: "Desconto criado com sucesso",
      });

      return data;
    } catch (error) {
      console.error('Erro ao criar desconto:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar desconto",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateDiscount = async (id: string, updates: Partial<PackageDiscount>) => {
    try {
      const { error } = await supabase
        .from('package_discounts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchDiscounts();
      toast({
        title: "Sucesso",
        description: "Desconto atualizado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao atualizar desconto:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar desconto",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteDiscount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('package_discounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchDiscounts();
      toast({
        title: "Sucesso",
        description: "Desconto removido com sucesso",
      });
    } catch (error) {
      console.error('Erro ao remover desconto:', error);
      toast({
        title: "Erro",
        description: "Falha ao remover desconto",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    discounts,
    loading,
    getActiveDiscountForPackage,
    calculateDiscountedPrice,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    refetch: fetchDiscounts
  };
};