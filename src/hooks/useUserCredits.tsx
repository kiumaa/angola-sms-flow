import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useUserCredits = () => {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user]);

  const fetchCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar créditos:', error);
        return;
      }

      // Se não há perfil, retorna 0 créditos
      setCredits(data?.credits || 0);
    } catch (error) {
      console.error('Erro ao buscar créditos:', error);
    } finally {
      setLoading(false);
    }
  };

  return { 
    credits, 
    loading, 
    refetch: fetchCredits,
    refresh: fetchCredits // Alias for easier usage
  };
};