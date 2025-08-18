import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface Contact {
  id: string;
  name: string;
  phone: string;
  phone_e164: string | null;
  email: string | null;
  tags: string[] | null;
  attributes: any;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

interface ContactList {
  id: string;
  name: string;
  description: string | null;
  rule: any;
  created_at: string;
  updated_at: string;
}

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchContacts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('contacts-api', {
        body: { action: 'list' }
      });

      if (error) throw error;
      
      setContacts(data?.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contatos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchContactLists = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('contact_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setContactLists(data || []);
    } catch (error) {
      console.error('Error fetching contact lists:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar listas de contatos.",
        variant: "destructive"
      });
    }
  };

  const createContact = async (contactData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('contacts-api', {
        body: {
          action: 'create',
          ...contactData
        }
      });

      if (error) throw error;
      
      await fetchContacts(); // Refresh list
      
      toast({
        title: "Sucesso",
        description: "Contato criado com sucesso.",
      });
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar contato.",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const updateContact = async (contactId: string, contactData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('contacts-api', {
        body: {
          action: 'update',
          id: contactId,
          ...contactData
        }
      });

      if (error) throw error;
      
      await fetchContacts(); // Refresh list
      
      toast({
        title: "Sucesso",
        description: "Contato atualizado com sucesso.",
      });
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating contact:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar contato.",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const deleteContact = async (contactId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('contacts-api', {
        body: {
          action: 'delete',
          id: contactId
        }
      });

      if (error) throw error;
      
      setContacts(prev => prev.filter(c => c.id !== contactId));
      
      toast({
        title: "Sucesso",
        description: "Contato removido com sucesso.",
      });
      
      return { data, error: null };
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover contato.",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const searchContacts = async (query: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('contacts-api', {
        body: {
          action: 'list',
          search: query
        }
      });

      if (error) throw error;
      
      setContacts(data?.contacts || []);
    } catch (error) {
      console.error('Error searching contacts:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar contatos.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchContacts();
      fetchContactLists();
    }
  }, [user]);

  return {
    contacts,
    contactLists,
    loading,
    createContact,
    updateContact,
    deleteContact,
    searchContacts,
    refetch: fetchContacts
  };
};