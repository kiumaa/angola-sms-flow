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
      console.debug('[Pricing][usePackages] fetchPackages:start', new Date().toISOString());

      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('credits', { ascending: true });

      if (error) throw error;

      console.debug('[Pricing][usePackages] fetchPackages:response', { rawCount: data?.length ?? 0, data });

      // Filter out packages with invalid data (0 credits or 0 price)
      const validPackages = (data || []).filter((pkg) =>
        pkg.credits > 0 && pkg.price_kwanza > 0
      );

      console.debug('[Pricing][usePackages] fetchPackages:valid', { validCount: validPackages.length, validPackages });
      if (typeof window !== 'undefined') {
        (window as any).__PKG_DEBUG__ = { data, validPackages, ts: Date.now() };
      }

      setPackages(validPackages);
    } catch (error) {
      console.error('[Pricing][usePackages] Error fetching packages:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar pacotes de créditos.",
        variant: "destructive",
      });
    } finally {
      console.debug('[Pricing][usePackages] fetchPackages:finally -> setLoading(false)');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.debug('[Pricing][usePackages] useEffect:mount -> fetchPackages()');
    fetchPackages();
  }, []);

  useEffect(() => {
    console.debug('[Pricing][usePackages] state-changed', { loading, packagesCount: packages.length });
  }, [loading, packages]);

  return {
    packages,
    loading,
    refetch: fetchPackages
  };
};