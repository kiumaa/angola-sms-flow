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
      let { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', user?.id)
        .single();

      // Se o perfil não existe, criar automaticamente
      if (error && error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: user?.id,
            email: user?.email,
            full_name: user?.user_metadata?.full_name || user?.email,
            credits: 5 // Créditos iniciais
          })
          .select('credits')
          .single();

        if (createError) {
          console.error('Erro ao criar perfil:', createError);
          return;
        }
        
        data = newProfile;
      } else if (error) {
        console.error('Erro ao buscar créditos:', error);
        return;
      }

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