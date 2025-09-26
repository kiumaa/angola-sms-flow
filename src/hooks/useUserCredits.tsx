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
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar créditos:', error);
        setCredits(0);
        return;
      }

      // Se não existe perfil, cria um novo com créditos padrão
      if (!data) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: user?.id,
              credits: 10,
              email: user?.email,
              full_name: user?.email?.split('@')[0] || 'Usuário'
            }
          ])
          .select('credits')
          .single();

        if (createError) {
          console.error('Erro ao criar perfil:', createError);
          setCredits(0);
          return;
        }

        setCredits(newProfile?.credits || 10);
      } else {
        setCredits(data.credits || 0);
      }
    } catch (error) {
      console.error('Erro ao buscar créditos:', error);
      setCredits(0);
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