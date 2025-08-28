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
      
      // Use GET request to the contacts-api endpoint
      const response = await fetch(
        `https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/contacts-api`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3eHhjcHJxeHF6bnNlbHd6Z2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDA5NDUsImV4cCI6MjA2NzExNjk0NX0.mjm1kF6gI55F9DLYfueAVOKokvTY8_nv0sFvvG_ReQs'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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
      const response = await fetch(
        `https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/contacts-api`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3eHhjcHJxeHF6bnNlbHd6Z2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDA5NDUsImV4cCI6MjA2NzExNjk0NX0.mjm1kF6gI55F9DLYfueAVOKokvTY8_nv0sFvvG_ReQs'
          },
          body: JSON.stringify(contactData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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
      const response = await fetch(
        `https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/contacts-api/${contactId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3eHhjcHJxeHF6bnNlbHd6Z2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDA5NDUsImV4cCI6MjA2NzExNjk0NX0.mjm1kF6gI55F9DLYfueAVOKokvTY8_nv0sFvvG_ReQs'
          },
          body: JSON.stringify(contactData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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
      const response = await fetch(
        `https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/contacts-api/${contactId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3eHhjcHJxeHF6bnNlbHd6Z2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDA5NDUsImV4cCI6MjA2NzExNjk0NX0.mjm1kF6gI55F9DLYfueAVOKokvTY8_nv0sFvvG_ReQs'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      setContacts(prev => prev.filter(c => c.id !== contactId));
      
      toast({
        title: "Sucesso",
        description: "Contato removido com sucesso.",
      });
      
      return { data: null, error: null };
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
      const params = new URLSearchParams();
      if (query) params.append('search', query);
      
      const response = await fetch(
        `https://hwxxcprqxqznselwzghi.supabase.co/functions/v1/contacts-api?${params}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3eHhjcHJxeHF6bnNlbHd6Z2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NDA5NDUsImV4cCI6MjA2NzExNjk0NX0.mjm1kF6gI55F9DLYfueAVOKokvTY8_nv0sFvvG_ReQs'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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