import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface CountryPricing {
  id: string;
  country_code: string;
  country_name: string;
  credits_multiplier: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCountryPricing = () => {
  const [pricing, setPricing] = useState<CountryPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPricing = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('country_pricing')
        .select('*')
        .eq('is_active', true)
        .order('country_name');

      if (error) throw error;
      
      setPricing(data || []);
    } catch (error) {
      console.error('Error fetching country pricing:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar preços por país.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const getMultiplierByCountryCode = (countryCode: string): number => {
    const country = pricing.find(p => p.country_code === countryCode);
    return country?.credits_multiplier || 1;
  };

  const getCountryNameByCode = (countryCode: string): string => {
    const country = pricing.find(p => p.country_code === countryCode);
    return country?.country_name || 'País desconhecido';
  };

  return {
    pricing,
    loading,
    refetch: fetchPricing,
    getMultiplierByCountryCode,
    getCountryNameByCode
  };
};