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
      
      // First get all profiles
      let profileQuery = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply profile-based filters
      if (filters?.search) {
        profileQuery = profileQuery.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      
      if (filters?.status && filters.status !== 'all') {
        profileQuery = profileQuery.eq('user_status', filters.status);
      }
      
      if (filters?.company) {
        profileQuery = profileQuery.ilike('company_name', `%${filters.company}%`);
      }

      const { data: profiles, error: profileError } = await profileQuery;
      
      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        setUsers([]);
        setTotalUsers(0);
        return;
      }

      // Get user roles for all users
      const userIds = profiles.map(p => p.user_id);
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (roleError) throw roleError;

      // Combine data and ensure proper typing
      const usersWithRoles: User[] = profiles.map(profile => {
        const roles = userRoles?.filter(r => r.user_id === profile.user_id) || [];
        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email || '',
          full_name: profile.full_name || '',
          company_name: profile.company_name || undefined,
          phone: profile.phone || undefined,
          credits: profile.credits || 0,
          user_status: (profile.user_status || 'active') as 'active' | 'inactive' | 'suspended',
          created_at: profile.created_at,
          user_roles: roles.map(r => ({ role: r.role }))
        };
      });

      // Apply role filter
      let filteredUsers = usersWithRoles;
      if (filters?.role && filters.role !== 'all') {
        filteredUsers = usersWithRoles.filter(user => 
          user.user_roles.some(r => r.role === filters.role)
        );
      }
      
      setUsers(filteredUsers);
      setTotalUsers(filteredUsers.length);
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