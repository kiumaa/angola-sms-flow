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
  created_at?: string;
  updated_at?: string;
  display_name?: string;
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

      // Buscar sender IDs do usuário com campos específicos
      const { data, error: fetchError } = await supabase
        .from('sender_ids')
        .select(`
          id,
          sender_id,
          status,
          is_default,
          bulksms_status,
          supported_gateways,
          user_id,
          created_at,
          updated_at
        `)
        .eq('user_id', targetUserId)
        .neq('status', 'archived')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Filtrar e normalizar dados
      const rawSenderIds = data || [];
      const filteredSenderIds = filterValidSenderIds(rawSenderIds);
      const senderIdsWithSMSAO = ensureSMSAOInList(filteredSenderIds);

      console.log(`Carregados ${senderIdsWithSMSAO.length} sender IDs para usuário ${targetUserId}`);
      
      setSenderIds(senderIdsWithSMSAO);

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
        display_name: `${DEFAULT_SENDER_ID} (Padrão)`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const createSenderId = async (senderIdInput: string, isDefault: boolean = false) => {
    if (!targetUserId) return false;

    try {
      const normalizedSenderId = resolveSenderId(senderIdInput);
      
      // Verificar se já existe (case-insensitive)
      const exists = senderIds.some(s => s.sender_id.toUpperCase() === normalizedSenderId);
      if (exists) {
        throw new Error(`Sender ID "${normalizedSenderId}" já existe para este usuário.`);
      }

      const { data, error } = await supabase
        .from('sender_ids')
        .insert({
          user_id: targetUserId,
          sender_id: normalizedSenderId,
          status: normalizedSenderId === DEFAULT_SENDER_ID ? 'approved' : 'pending',
          is_default: isDefault || normalizedSenderId === DEFAULT_SENDER_ID,
          bulksms_status: normalizedSenderId === DEFAULT_SENDER_ID ? 'approved' : 'pending',
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
      
      // Prevenir exclusão do SMSAO
      if (senderToDelete?.sender_id === DEFAULT_SENDER_ID) {
        throw new Error(`${DEFAULT_SENDER_ID} é o Sender ID padrão e não pode ser removido.`);
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
    return senderIds.find(s => s.is_default) || senderIds.find(s => s.sender_id === DEFAULT_SENDER_ID);
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