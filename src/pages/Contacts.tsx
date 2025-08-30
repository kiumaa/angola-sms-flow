import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Upload, Download, Search, Users, FileText, Phone, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CSVImport from "@/components/contacts/CSVImport";
import ContactForm from "@/components/contacts/ContactForm";
import ContactViewModal from "@/components/contacts/ContactViewModal";
import ContactListForm from "@/components/contacts/ContactListForm";
import { useContacts } from "@/hooks/useContacts";
import { ContactStats } from "@/components/contacts/ContactStats";
import { ContactActions } from "@/components/contacts/ContactActions";
import { EmptyState } from "@/components/shared/EmptyState";

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showContactView, setShowContactView] = useState(false);
  const [showListForm, setShowListForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [editingContact, setEditingContact] = useState<any>(null);
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

  const handleSendEmail = (contact: any) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "O envio de emails será implementado em breve.",
    });
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
    refetch(); // Refresh the contacts list
    toast({
      title: "Importação concluída",
      description: `${importedContacts.length} contatos foram importados com sucesso.`,
    });
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
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
                    onClick={handleExportContacts}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Contacts Table */}
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle className="gradient-text">Lista de Contatos</CardTitle>
                <CardDescription>
                  {contacts.length} contatos encontrados
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
                  <div className="rounded-2xl border border-glass-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableHead className="font-medium">Nome</TableHead>
                          <TableHead className="font-medium">Telefone</TableHead>
                          <TableHead className="font-medium">Email</TableHead>
                          <TableHead className="font-medium">Status</TableHead>
                          <TableHead className="font-medium">Tags</TableHead>
                          <TableHead className="font-medium text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contacts.map((contact) => (
                          <TableRow key={contact.id} className="hover:bg-muted/10 group">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-2xl bg-gradient-primary shadow-glow">
                                  <Users className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium">{contact.name || 'Sem nome'}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Criado em {new Date(contact.created_at).toLocaleDateString('pt-BR')}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono text-sm">
                                  {contact.phone_e164 || contact.phone}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleSendSMS(contact)}
                                  title="Enviar SMS"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              {contact.email ? (
                                <span className="text-sm">{contact.email}</span>
                              ) : (
                                <span className="text-muted-foreground text-sm">Não informado</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={contact.is_blocked ? "destructive" : "default"}
                                className="text-xs"
                              >
                                {contact.is_blocked ? 'Bloqueado' : 'Ativo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap max-w-32">
                                {contact.tags && contact.tags.length > 0 ? (
                                  contact.tags.slice(0, 2).map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-xs">Sem tags</span>
                                )}
                                {contact.tags && contact.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{contact.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <ContactActions
                                contact={contact}
                                onView={handleViewContact}
                                onEdit={handleEditContact}
                                onDelete={handleDeleteContact}
                                onToggleBlock={handleToggleBlock}
                                onSendSMS={handleSendSMS}
                                onSendEmail={handleSendEmail}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <ContactStats 
              contacts={contacts} 
              contactListsCount={contactLists.length} 
            />

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
                              {list.description}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Lista
                        </Badge>
                    </div>
                  </Card>
                ))}
                
                <Button 
                  variant="outline" 
                  className="w-full glass-card border-glass-border border-dashed hover:border-primary"
                  onClick={() => setShowListForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Lista
                </Button>
              </CardContent>
            </Card>

            {/* Import Tips */}
            <Card className="card-futuristic border-blue-500/30 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="text-blue-400 text-lg">💡 Dicas de Importação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Use formato CSV com colunas: nome, telefone, email</p>
                <p>• Telefones devem incluir código do país (+244)</p>
                <p>• Máximo de 10.000 contatos por importação</p>
                <p>• Remova duplicatas antes de importar</p>
                <p>• Respeite as leis de proteção de dados</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modals */}
        {showImport && (
          <CSVImport 
            onImportComplete={() => {
              setShowImport(false);
              refetch();
              toast({
                title: "Importação concluída",
                description: "Contatos importados com sucesso.",
              });
            }}
          />
        )}

        <ContactForm
          open={showContactForm}
          onOpenChange={(open) => {
            setShowContactForm(open);
            if (!open) setEditingContact(null);
          }}
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
          onSendEmail={handleSendEmail}
        />

        <ContactListForm
          open={showListForm}
          onOpenChange={setShowListForm}
          onSave={() => {
            refetch();
            toast({
              title: "Lista criada",
              description: "Nova lista de contatos criada com sucesso.",
            });
          }}
        />
      </div>
    </DashboardLayout>
  );
};
export default Contacts;