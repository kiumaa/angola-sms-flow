import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  credits: number;
  created_at: string;
  updated_at: string;
  user_status: string;
  phone?: string;
  company_name?: string;
  roles: string[];
  last_login?: string;
  total_sms_sent?: number;
}

export interface AdminStats {
  totalUsers: number;
  totalCreditsIssued: number;
  totalSMSSent: number;
  activeUsers: number;
  pendingCreditRequests: number;
  recentSignups: number;
  monthlyGrowth: number;
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchUsers = async () => {
    if (!user || !isAdmin) return;

    try {
      setLoading(true);

      // Fetch users with their profiles and roles separately
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get roles for each user
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Transform data to include aggregated stats
      const transformedUsers: AdminUser[] = await Promise.all(
        (usersData || []).map(async (profile) => {
          // Get SMS stats for each user from sms_logs
          const { data: smsStats } = await supabase
            .from('sms_logs')
            .select('id')
            .eq('user_id', profile.user_id);

          const totalSent = smsStats?.length || 0;
          const userRoles = (rolesData || []).filter(r => r.user_id === profile.user_id);

          return {
            id: profile.id,
            user_id: profile.user_id,
            email: profile.email || '',
            full_name: profile.full_name || '',
            credits: profile.credits || 0,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            user_status: profile.user_status || 'active',
            phone: profile.phone,
            company_name: profile.company_name,
            roles: userRoles.map(r => r.role),
            total_sms_sent: totalSent
          };
        })
      );

      setUsers(transformedUsers);

      // Calculate admin stats
      const totalUsers = transformedUsers.length;
      const totalCreditsIssued = transformedUsers.reduce((sum, u) => sum + u.credits, 0);
      const totalSMSSent = transformedUsers.reduce((sum, u) => sum + (u.total_sms_sent || 0), 0);
      const activeUsers = transformedUsers.filter(u => u.user_status === 'active').length;

      // Get pending credit requests
      const { data: creditRequests } = await supabase
        .from('credit_requests')
        .select('id')
        .eq('status', 'pending');

      const pendingCreditRequests = creditRequests?.length || 0;

      // Calculate recent signups (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentSignups = transformedUsers.filter(
        u => new Date(u.created_at) >= thirtyDaysAgo
      ).length;

      setStats({
        totalUsers,
        totalCreditsIssued,
        totalSMSSent,
        activeUsers,
        pendingCreditRequests,
        recentSignups,
        monthlyGrowth: totalUsers > 0 ? Math.round((recentSignups / totalUsers) * 100) : 0
      });

    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserCredits = async (userId: string, credits: number, reason: string) => {
    if (!isAdmin) return { error: 'Unauthorized' };

    try {
      // Get current user data
      const { data: currentUser, error: fetchError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = (currentUser.credits || 0) + credits;

      // Update user credits
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          credits: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Log the adjustment
      const { error: logError } = await supabase
        .from('credit_adjustments')
        .insert({
          user_id: userId,
          admin_id: user?.id,
          delta: credits,
          previous_balance: currentUser.credits || 0,
          new_balance: newBalance,
          reason,
          adjustment_type: credits > 0 ? 'admin_credit' : 'admin_debit'
        });

      if (logError) throw logError;

      await fetchUsers(); // Refresh data

      toast({
        title: "Sucesso",
        description: `Créditos ${credits > 0 ? 'adicionados' : 'removidos'} com sucesso.`,
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating credits:', error);
      toast({
        title: "Erro",
        description: "Erro ao ajustar créditos.",
        variant: "destructive"
      });
      return { error: 'Failed to update credits' };
    }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    if (!isAdmin) return { error: 'Unauthorized' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          user_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      await fetchUsers(); // Refresh data

      toast({
        title: "Sucesso",
        description: `Status do usuário atualizado para ${status}.`,
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do usuário.",
        variant: "destructive"
      });
      return { error: 'Failed to update status' };
    }
  };

  const deleteUser = async (userId: string) => {
    if (!isAdmin) return { error: 'Unauthorized' };

    try {
      // This will cascade delete profile due to foreign key
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      await fetchUsers(); // Refresh data

      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso.",
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover usuário.",
        variant: "destructive"
      });
      return { error: 'Failed to delete user' };
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin]);

  return {
    users,
    stats,
    loading,
    updateUserCredits,
    updateUserStatus,
    deleteUser,
    refetch: fetchUsers
  };
};