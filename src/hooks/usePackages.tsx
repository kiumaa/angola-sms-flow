import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

interface CreditPackage {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  price_kwanza: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePackages = () => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPackages = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('credits', { ascending: true });

      if (error) throw error;
      
      // Filter out packages with invalid data (0 credits or 0 price)
      const validPackages = (data || []).filter(pkg => 
        pkg.credits > 0 && pkg.price_kwanza > 0
      );
      
      setPackages(validPackages);
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pacotes de créditos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return {
    packages,
    loading,
    refetch: fetchPackages
  };
};