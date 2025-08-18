import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { resolveSenderId, ensureSMSAOInList, filterValidSenderIds, DEFAULT_SENDER_ID } from "@/lib/senderIdUtils";

export interface SenderIdData {
  id: string;
  sender_id: string;
  status: string;
  is_default: boolean;
  bulksms_status?: string;
  supported_gateways?: string[];
  user_id?: string;
  account_id?: string | null;
  created_at?: string;
  updated_at?: string;
  display_name?: string;
  is_system_default?: boolean; // Para identificar o SMSAO global
}

export const useSenderIds = (userId?: string) => {
  const [senderIds, setSenderIds] = useState<SenderIdData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const targetUserId = userId || user?.id;

  const fetchSenderIds = async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Buscar tanto o SMSAO global quanto os sender IDs do usuário
      const { data, error: fetchError } = await supabase
        .from('sender_ids')
        .select('*')
        .or(`account_id.is.null,and(user_id.eq.${targetUserId},account_id.not.is.null)`)
        .neq('status', 'archived')
        .order('account_id', { ascending: true, nullsFirst: true }) // Global primeiro
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Processar e marcar sender IDs
      const processedSenderIds = (data || []).map(item => ({
        ...item,
        is_system_default: item.account_id === null && item.sender_id === DEFAULT_SENDER_ID,
        display_name: item.account_id === null && item.sender_id === DEFAULT_SENDER_ID 
          ? `${item.sender_id} (Padrão do Sistema)`
          : item.sender_id
      }));

      console.log(`Carregados ${processedSenderIds.length} sender IDs (incluindo global) para usuário ${targetUserId}`);
      
      setSenderIds(processedSenderIds);

    } catch (err: any) {
      console.error('Erro ao carregar sender IDs:', err);
      setError(err.message);
      
      // Fallback: garantir que pelo menos SMSAO esteja disponível
      setSenderIds([{
        id: 'fallback-smsao',
        sender_id: DEFAULT_SENDER_ID,
        status: 'approved',
        is_default: true,
        bulksms_status: 'approved',
        supported_gateways: ['bulksms'],
        display_name: `${DEFAULT_SENDER_ID} (Padrão do Sistema)`,
        is_system_default: true,
        account_id: null
      }]);
    } finally {
      setLoading(false);
    }
  };

  const createSenderId = async (senderIdInput: string, isDefault: boolean = false) => {
    if (!targetUserId) return false;

    try {
      const normalizedSenderId = resolveSenderId(senderIdInput);
      
      // Bloquear criação de SMSAO por usuários
      if (normalizedSenderId.toUpperCase() === 'SMSAO') {
        throw new Error('SMSAO é reservado como padrão do sistema e não pode ser criado por usuários.');
      }
      
      // Verificar se já existe (case-insensitive) - apenas nos sender IDs do usuário
      const userSenderIds = senderIds.filter(s => s.account_id !== null);
      const exists = userSenderIds.some(s => s.sender_id.toUpperCase() === normalizedSenderId.toUpperCase());
      if (exists) {
        throw new Error(`Sender ID "${normalizedSenderId}" já existe para este usuário.`);
      }

      // Obter account_id do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', targetUserId)
        .single();

      if (!profile) {
        throw new Error('Perfil do usuário não encontrado.');
      }

      const { data, error } = await supabase
        .from('sender_ids')
        .insert({
          user_id: targetUserId,
          account_id: profile.id,
          sender_id: normalizedSenderId,
          status: 'pending',
          is_default: isDefault,
          bulksms_status: 'pending',
          supported_gateways: ['bulksms']
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`Sender ID criado: ${normalizedSenderId}`);
      await fetchSenderIds(); // Recarregar lista
      return true;

    } catch (err: any) {
      console.error('Erro ao criar sender ID:', err);
      setError(err.message);
      return false;
    }
  };

  const updateSenderId = async (id: string, updates: Partial<SenderIdData>) => {
    try {
      // Normalizar sender_id se fornecido
      if (updates.sender_id) {
        updates.sender_id = resolveSenderId(updates.sender_id);
      }

      const { error } = await supabase
        .from('sender_ids')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      console.log(`Sender ID atualizado: ${id}`);
      await fetchSenderIds(); // Recarregar lista
      return true;

    } catch (err: any) {
      console.error('Erro ao atualizar sender ID:', err);
      setError(err.message);
      return false;
    }
  };

  const deleteSenderId = async (id: string) => {
    try {
      const senderToDelete = senderIds.find(s => s.id === id);
      
      // Prevenir exclusão do SMSAO global
      if (senderToDelete?.is_system_default) {
        throw new Error('SMSAO é o Sender ID padrão do sistema e não pode ser removido.');
      }

      // Só permitir deletar sender IDs próprios do usuário
      if (senderToDelete?.account_id === null) {
        throw new Error('Não é possível remover Sender IDs globais do sistema.');
      }

      const { error } = await supabase
        .from('sender_ids')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;

      console.log(`Sender ID arquivado: ${id}`);
      await fetchSenderIds(); // Recarregar lista
      return true;

    } catch (err: any) {
      console.error('Erro ao arquivar sender ID:', err);
      setError(err.message);
      return false;
    }
  };

  const setDefaultSenderId = async (id: string) => {
    try {
      // Remover default de todos os outros
      const { error: resetError } = await supabase
        .from('sender_ids')
        .update({ is_default: false })
        .eq('user_id', targetUserId)
        .neq('id', id);

      if (resetError) throw resetError;

      // Definir o novo como default
      const { error: setError } = await supabase
        .from('sender_ids')
        .update({ is_default: true })
        .eq('id', id);

      if (setError) throw setError;

      console.log(`Novo default sender ID: ${id}`);
      await fetchSenderIds(); // Recarregar lista
      return true;

    } catch (err: any) {
      console.error('Erro ao definir default sender ID:', err);
      setError(err.message);
      return false;
    }
  };

  const getDefaultSenderId = (): SenderIdData | undefined => {
    // Preferir sender ID próprio do usuário marcado como default
    const userDefault = senderIds.find(s => s.is_default && s.account_id !== null);
    if (userDefault) return userDefault;
    
    // Fallback para o SMSAO global
    return senderIds.find(s => s.is_system_default) || senderIds.find(s => s.sender_id === DEFAULT_SENDER_ID);
  };

  const getSenderIdForDropdown = () => {
    return senderIds.map(s => ({
      value: s.sender_id,
      label: s.display_name || s.sender_id,
      isDefault: s.is_default,
      status: s.status
    }));
  };

  useEffect(() => {
    fetchSenderIds();
  }, [targetUserId]);

  return {
    senderIds,
    loading,
    error,
    fetchSenderIds,
    createSenderId,
    updateSenderId,
    deleteSenderId,
    setDefaultSenderId,
    getDefaultSenderId,
    getSenderIdForDropdown,
    clearError: () => setError(null)
  };
};