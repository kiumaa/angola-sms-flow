import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  company_name?: string;
  phone?: string;
  credits: number;
  user_status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  user_roles: { role: 'admin' | 'client' }[];
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const { toast } = useToast();

  const fetchUsers = async (filters?: {
    search?: string;
    role?: string;
    status?: string;
    company?: string;
  }) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(role)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      
      if (filters?.role && filters.role !== 'all') {
        query = query.eq('user_roles.role', filters.role as 'admin' | 'client');
      }
      
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('user_status', filters.status);
      }
      
      if (filters?.company) {
        query = query.ilike('company_name', `%${filters.company}%`);
      }

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setUsers((data as any[])?.map(user => ({
        ...user,
        user_roles: user.user_roles ? [user.user_roles] : []
      })) || []);
      setTotalUsers(count || 0);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: {
    email: string;
    password: string;
    full_name: string;
    company_name?: string;
    phone?: string;
    role: 'admin' | 'client';
    initial_credits: number;
  }) => {
    try {
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          company_name: userData.company_name,
          phone: userData.phone,
        }
      });

      if (authError) throw authError;

      // Update profile with additional data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: userData.full_name,
          company_name: userData.company_name,
          phone: userData.phone,
          credits: userData.initial_credits,
        })
        .eq('user_id', authData.user.id);

      if (profileError) throw profileError;

      // Set user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: userData.role })
        .eq('user_id', authData.user.id);

      if (roleError) throw roleError;

      toast({
        title: "Usuário criado",
        description: "Usuário criado com sucesso. Email de boas-vindas enviado.",
      });

      return authData.user;
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateUser = async (userId: string, updates: {
    full_name?: string;
    email?: string;
    company_name?: string;
    phone?: string;
    role?: 'admin' | 'client';
  }) => {
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: updates.full_name,
          company_name: updates.company_name,
          phone: updates.phone,
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // Update email if changed
      if (updates.email) {
        const { error: emailError } = await supabase.auth.admin.updateUserById(userId, {
          email: updates.email,
        });
        if (emailError) throw emailError;
      }

      // Update role if changed
      if (updates.role) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: updates.role })
          .eq('user_id', userId);
        if (roleError) throw roleError;
      }

      toast({
        title: "Usuário atualizado",
        description: "Dados do usuário atualizados com sucesso.",
      });

      await fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const adjustCredits = async (userId: string, delta: number, reason: string, adjustmentType: 'manual' | 'bonus' | 'refund' = 'manual') => {
    try {
      // Get current balance
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      const currentBalance = profile.credits || 0;
      const newBalance = currentBalance + delta;

      if (newBalance < 0) {
        throw new Error('Saldo não pode ficar negativo');
      }

      // Update credits
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: newBalance })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Record adjustment
      const { error: adjustmentError } = await supabase
        .from('credit_adjustments')
        .insert({
          user_id: userId,
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          delta,
          reason,
          previous_balance: currentBalance,
          new_balance: newBalance,
          adjustment_type: adjustmentType,
        });

      if (adjustmentError) throw adjustmentError;

      toast({
        title: "Créditos ajustados",
        description: "Créditos ajustados. Usuário notificado por email.",
      });

      await fetchUsers();
    } catch (error: any) {
      console.error('Error adjusting credits:', error);
      toast({
        title: "Erro ao ajustar créditos",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Soft delete by updating status
      const { error } = await supabase
        .from('profiles')
        .update({ user_status: 'inactive' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Usuário desativado",
        description: "Usuário desativado com sucesso.",
      });

      await fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro ao desativar usuário",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    totalUsers,
    fetchUsers,
    createUser,
    updateUser,
    adjustCredits,
    deleteUser,
    refetch: fetchUsers,
  };
};