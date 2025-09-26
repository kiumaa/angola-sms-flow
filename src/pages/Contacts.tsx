import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Upload, Download, Search, Users, FileText, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CSVImport from "@/components/contacts/CSVImport";
import ContactForm from "@/components/contacts/ContactForm";
import ContactViewModal from "@/components/contacts/ContactViewModal";
import ContactListForm from "@/components/contacts/ContactListForm";
import ContactTable from "@/components/contacts/ContactTable";
import { ContactBulkActions } from "@/components/contacts/ContactBulkActions";
import { ContactAdvancedFilters } from "@/components/contacts/ContactAdvancedFilters";
import { useContacts } from "@/hooks/useContacts";
import { ContactStats } from "@/components/contacts/ContactStats";
import { EmptyState } from "@/components/shared/EmptyState";

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showContactView, setShowContactView] = useState(false);
  const [showListForm, setShowListForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [filters, setFilters] = useState<any>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    contacts, 
    contactLists, 
    loading: isLoading, 
    createContact,
    updateContact,
    deleteContact,
    searchContacts,
    refetch 
  } = useContacts();

  // Handle search with debounce
  useEffect(() => {
    if (searchTerm.trim()) {
      const timeoutId = setTimeout(() => {
        searchContacts(searchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      refetch();
    }
  }, [searchTerm]);

  const handleDeleteContact = async (contactId: string) => {
    await deleteContact(contactId);
  };

  const handleViewContact = (contact: any) => {
    setSelectedContact(contact);
    setShowContactView(true);
  };

  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    setShowContactForm(true);
  };

  const handleToggleBlock = async (contactId: string, isBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ is_blocked: isBlocked })
        .eq('id', contactId);

      if (error) throw error;

      toast({
        title: isBlocked ? "Contato bloqueado" : "Contato desbloqueado",
        description: `O contato foi ${isBlocked ? 'bloqueado' : 'desbloqueado'} com sucesso.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do contato.",
        variant: "destructive",
      });
    }
  };

  const handleSendSMS = (contact: any) => {
    navigate(`/quick-send?phone=${encodeURIComponent(contact.phone_e164 || contact.phone)}`);
  };

  const handleSaveContact = async (contactData: any) => {
    try {
      if (editingContact) {
        await updateContact(editingContact.id, contactData);
        toast({
          title: "Contato atualizado",
          description: "As informações do contato foram atualizadas com sucesso.",
        });
      } else {
        await createContact(contactData);
        toast({
          title: "Contato criado",
          description: "Novo contato adicionado com sucesso.",
        });
      }
      
      setShowContactForm(false);
      setEditingContact(null);
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: editingContact 
          ? "Não foi possível atualizar o contato." 
          : "Não foi possível criar o contato.",
        variant: "destructive",
      });
    }
  };

  const handleExportContacts = () => {
    if (contacts.length === 0) {
      toast({
        title: "Nenhum contato",
        description: "Não há contatos para exportar.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = ['Nome', 'Telefone', 'Email', 'Empresa', 'Status', 'Tags', 'Data de Criação'];
    const csvContent = [
      headers.join(','),
      ...contacts.map(contact => [
        `"${contact.name || ''}"`,
        `"${contact.phone_e164 || contact.phone || ''}"`,
        `"${contact.email || ''}"`,
        `"${contact.attributes?.company || ''}"`,
        `"${contact.is_blocked ? 'Bloqueado' : 'Ativo'}"`,
        `"${contact.tags ? contact.tags.join('; ') : ''}"`,
        `"${new Date(contact.created_at).toLocaleDateString('pt-BR')}"`
      ].join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contatos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação concluída",
      description: `${contacts.length} contatos foram exportados com sucesso.`,
    });
  };

  const handleImportSuccess = (importedContacts: any[]) => {
    setShowImport(false);
    refetch();
    toast({
      title: "Importação concluída",
      description: `${importedContacts.length} contatos foram importados com sucesso.`,
    });
  };

  // Bulk Actions
  const handleSelectContact = (contactId: string, selected: boolean) => {
    setSelectedContacts(prev => 
      selected 
        ? [...prev, contactId]
        : prev.filter(id => id !== contactId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedContacts(selected ? contacts.map(c => c.id) : []);
  };

  const handleBulkDelete = async () => {
    try {
      for (const contactId of selectedContacts) {
        await deleteContact(contactId);
      }
      setSelectedContacts([]);
      toast({
        title: "Contatos excluídos",
        description: `${selectedContacts.length} contatos foram excluídos com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir contatos selecionados.",
        variant: "destructive",
      });
    }
  };

  const handleBulkSMS = () => {
    const phones = selectedContacts
      .map(id => contacts.find(c => c.id === id))
      .filter(c => c)
      .map(c => c.phone_e164 || c.phone)
      .join(',');
    
    navigate(`/quick-send?phones=${encodeURIComponent(phones)}`);
  };

  const handleBulkBlock = async () => {
    try {
      for (const contactId of selectedContacts) {
        await supabase
          .from('contacts')
          .update({ is_blocked: true })
          .eq('id', contactId);
      }
      setSelectedContacts([]);
      refetch();
      toast({
        title: "Contatos bloqueados",
        description: `${selectedContacts.length} contatos foram bloqueados.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao bloquear contatos.",
        variant: "destructive",
      });
    }
  };

  const handleBulkUnblock = async () => {
    try {
      for (const contactId of selectedContacts) {
        await supabase
          .from('contacts')
          .update({ is_blocked: false })
          .eq('id', contactId);
      }
      setSelectedContacts([]);
      refetch();
      toast({
        title: "Contatos desbloqueados",
        description: `${selectedContacts.length} contatos foram desbloqueados.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao desbloquear contatos.",
        variant: "destructive",
      });
    }
  };

  const handleBulkTag = () => {
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de tags em lote será implementada em breve.",
    });
  };

  const handleBulkExport = () => {
    const selectedContactsData = contacts.filter(c => selectedContacts.includes(c.id));
    
    const headers = ['Nome', 'Telefone', 'Email', 'Empresa', 'Status', 'Tags', 'Data de Criação'];
    const csvContent = [
      headers.join(','),
      ...selectedContactsData.map(contact => [
        `"${contact.name || ''}"`,
        `"${contact.phone_e164 || contact.phone || ''}"`,
        `"${contact.email || ''}"`,
        `"${contact.attributes?.company || ''}"`,
        `"${contact.is_blocked ? 'Bloqueado' : 'Ativo'}"`,
        `"${contact.tags ? contact.tags.join('; ') : ''}"`,
        `"${new Date(contact.created_at).toLocaleDateString('pt-BR')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contatos_selecionados_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportação concluída",
      description: `${selectedContactsData.length} contatos foram exportados.`,
    });
  };

  const handleFiltersReset = () => {
    setFilters({});
    refetch();
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 animate-pulse">
          <div className="h-20 bg-muted/20 rounded-3xl"></div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-96 bg-muted/20 rounded-3xl"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-muted/20 rounded-3xl"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="glass-card p-8 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="flex items-center justify-between relative">
            <div>
              <h1 className="text-4xl font-light mb-2 gradient-text">Contatos</h1>
              <p className="text-muted-foreground text-lg">
                Gerencie sua base de contatos e listas de marketing
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowImport(true)}
                variant="outline"
                className="glass-card border-glass-border text-lg px-6 py-6"
              >
                <Upload className="h-5 w-5 mr-2" />
                Importar CSV
              </Button>
              <Button 
                onClick={() => {
                  setEditingContact(null);
                  setShowContactForm(true);
                }}
                className="button-futuristic text-lg px-8 py-6"
              >
                <Plus className="h-5 w-5 mr-2" />
                Novo Contato
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <ContactStats 
              contacts={contacts} 
              contactListsCount={contactLists.length} 
            />

            {/* Advanced Filters */}
            {showFilters && (
              <ContactAdvancedFilters
                filters={filters}
                onFiltersChange={setFilters}
                onReset={handleFiltersReset}
              />
            )}

            {/* Contact Lists */}
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle className="gradient-text">Listas de Contatos</CardTitle>
                <CardDescription>Organize seus contatos em listas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {contactLists.map((list) => (
                  <Card 
                    key={list.id} 
                    className="p-4 cursor-pointer hover-lift glass-card border-glass-border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-2xl bg-gradient-primary shadow-glow">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium">{list.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {list.description || "Sem descrição"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                
                <Button
                  variant="outline"
                  className="w-full glass-card border-glass-border"
                  onClick={() => setShowListForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Lista
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Actions */}
            <Card className="card-futuristic">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, telefone ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 rounded-2xl glass-card border-glass-border"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    className="glass-card border-glass-border"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                  <Button 
                    variant="outline" 
                    className="glass-card border-glass-border"
                    onClick={handleExportContacts}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            <ContactBulkActions
              selectedContacts={selectedContacts}
              onBulkDelete={handleBulkDelete}
              onBulkSMS={handleBulkSMS}
              onBulkBlock={handleBulkBlock}
              onBulkUnblock={handleBulkUnblock}
              onBulkTag={handleBulkTag}
              onBulkExport={handleBulkExport}
            />

            {/* Contacts Table */}
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle className="gradient-text">Lista de Contatos</CardTitle>
                <CardDescription>
                  {contacts.length} contatos encontrados
                  {selectedContacts.length > 0 && ` • ${selectedContacts.length} selecionados`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contacts.length === 0 ? (
                  <EmptyState
                    icon={searchTerm ? Search : Users}
                    title={searchTerm ? "Nenhum contato encontrado" : "Nenhum contato ainda"}
                    description={searchTerm 
                      ? "Tente buscar com outros termos ou verifique a ortografia." 
                      : "Importe ou adicione contatos para começar suas campanhas de SMS."
                    }
                    action={!searchTerm ? (
                      <div className="flex gap-3">
                        <Button 
                          className="button-futuristic" 
                          onClick={() => setShowImport(true)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Importar Contatos
                        </Button>
                        <Button 
                          variant="outline"
                          className="glass-card border-glass-border"
                          onClick={() => {
                            setEditingContact(null);
                            setShowContactForm(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Contato
                        </Button>
                      </div>
                    ) : undefined}
                  />
                ) : (
                  <ContactTable
                    contacts={contacts}
                    selectedContacts={selectedContacts}
                    onSelectContact={handleSelectContact}
                    onSelectAll={handleSelectAll}
                    onEditContact={handleEditContact}
                    onDeleteContact={handleDeleteContact}
                    onToggleBlock={handleToggleBlock}
                    loading={isLoading}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modals */}
        <CSVImport
          open={showImport}
          onOpenChange={setShowImport}
          onImportComplete={() => {
            setShowImport(false);
            refetch();
            toast({
              title: "Importação concluída",
              description: "Contatos importados com sucesso.",
            });
          }}
        />

        <ContactForm
          open={showContactForm}
          onOpenChange={setShowContactForm}
          contact={editingContact}
          onSave={handleSaveContact}
        />

        <ContactViewModal
          open={showContactView}
          onOpenChange={setShowContactView}
          contact={selectedContact}
          onEdit={handleEditContact}
          onToggleBlock={handleToggleBlock}
          onSendSMS={handleSendSMS}
        />

        <ContactListForm
          open={showListForm}
          onOpenChange={setShowListForm}
        />
      </div>
    </DashboardLayout>
  );
};

export default Contacts;