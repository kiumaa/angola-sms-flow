import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Upload, Search, Edit, Trash2, List, UserPlus, Phone, Mail, Tag } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CSVImport from "@/components/contacts/CSVImport";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
}

interface ContactList {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  contact_count?: number;
}

const Contacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedList, setSelectedList] = useState<string>("all");
  
  // Form states
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isAddingList, setIsAddingList] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    email: "",
    tags: "",
    notes: ""
  });
  const [listForm, setListForm] = useState({
    name: "",
    description: ""
  });

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchContacts();
      fetchContactLists();
    }
  }, [user]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contatos.",
        variant: "destructive"
      });
    }
  };

  const fetchContactLists = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_lists')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get contact count for each list
      const listsWithCount = await Promise.all((data || []).map(async (list) => {
        const { count } = await supabase
          .from('contact_list_members')
          .select('*', { count: 'exact', head: true })
          .eq('list_id', list.id);
        
        return { ...list, contact_count: count || 0 };
      }));

      setContactLists(listsWithCount);
    } catch (error) {
      console.error('Error fetching contact lists:', error);
      toast({
        title: "Erro", 
        description: "Erro ao carregar listas de contatos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addContact = async () => {
    if (!contactForm.name || !contactForm.phone) {
      toast({
        title: "Erro",
        description: "Nome e telefone são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .insert({
          user_id: user?.id,
          name: contactForm.name,
          phone: contactForm.phone,
          email: contactForm.email || null,
          tags: contactForm.tags ? contactForm.tags.split(',').map(t => t.trim()) : [],
          notes: contactForm.notes || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Contato adicionado com sucesso.",
      });

      setContactForm({ name: "", phone: "", email: "", tags: "", notes: "" });
      setIsAddingContact(false);
      fetchContacts();
    } catch (error: any) {
      console.error('Error adding contact:', error);
      toast({
        title: "Erro",
        description: error.message?.includes('duplicate') ? 
          "Este telefone já está cadastrado." : 
          "Erro ao adicionar contato.",
        variant: "destructive"
      });
    }
  };

  const addContactList = async () => {
    if (!listForm.name) {
      toast({
        title: "Erro",
        description: "Nome da lista é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('contact_lists')
        .insert({
          user_id: user?.id,
          name: listForm.name,
          description: listForm.description || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Lista criada com sucesso.",
      });

      setListForm({ name: "", description: "" });
      setIsAddingList(false);
      fetchContactLists();
    } catch (error) {
      console.error('Error adding contact list:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar lista.",
        variant: "destructive"
      });
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Contato removido com sucesso.",
      });

      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover contato.",
        variant: "destructive"
      });
    }
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalContacts: contacts.length,
    totalLists: contactLists.length,
    recentContacts: contacts.filter(c => 
      new Date(c.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Contatos</h1>
            <p className="text-muted-foreground mt-2">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <Users className="h-8 w-8" />
              <span>Gestão de Contatos</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              Organize seus contatos e crie listas para suas campanhas
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Dialog open={isAddingList} onOpenChange={setIsAddingList}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <List className="h-4 w-4 mr-2" />
                  Nova Lista
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Lista</DialogTitle>
                  <DialogDescription>
                    Organize seus contatos em listas para facilitar o envio de campanhas
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="listName">Nome da Lista</Label>
                    <Input
                      id="listName"
                      placeholder="Ex: Clientes Premium"
                      value={listForm.name}
                      onChange={(e) => setListForm({...listForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="listDescription">Descrição (opcional)</Label>
                    <Textarea
                      id="listDescription"
                      placeholder="Descreva o propósito desta lista..."
                      value={listForm.description}
                      onChange={(e) => setListForm({...listForm, description: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddingList(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={addContactList}>
                      Criar Lista
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddingContact} onOpenChange={setIsAddingContact}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Contato
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Contato</DialogTitle>
                  <DialogDescription>
                    Adicione um novo contato à sua lista
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      placeholder="Nome completo"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      placeholder="+244 900 000 000"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                    <Input
                      id="tags"
                      placeholder="cliente, vip, luanda"
                      value={contactForm.tags}
                      onChange={(e) => setContactForm({...contactForm, tags: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      placeholder="Informações adicionais..."
                      value={contactForm.notes}
                      onChange={(e) => setContactForm({...contactForm, notes: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddingContact(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={addContact}>
                      Adicionar Contato
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Contatos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats.totalContacts}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Listas Criadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                {stats.totalLists}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Adicionados esta semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.recentContacts}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="contacts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="contacts">Contatos</TabsTrigger>
            <TabsTrigger value="import">Importar CSV</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Seus Contatos</CardTitle>
                <CardDescription>
                  Gerencie todos os seus contatos aqui
                </CardDescription>
                <div className="flex space-x-2">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar contatos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {searchTerm ? "Nenhum contato encontrado" : "Nenhum contato cadastrado"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm ? 
                        "Tente buscar com outros termos." :
                        "Comece adicionando seus primeiros contatos."
                      }
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setIsAddingContact(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Primeiro Contato
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredContacts.map((contact) => (
                      <div 
                        key={contact.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold">{contact.name}</h4>
                            {contact.tags && contact.tags.length > 0 && (
                              <div className="flex space-x-1">
                                {contact.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{contact.phone}</span>
                            </div>
                            {contact.email && (
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4" />
                                <span>{contact.email}</span>
                              </div>
                            )}
                            {contact.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {contact.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteContact(contact.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lists" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Listas de Contatos</CardTitle>
                <CardDescription>
                  Organize seus contatos em listas para campanhas direcionadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contactLists.length === 0 ? (
                  <div className="text-center py-8">
                    <List className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma lista criada</h3>
                    <p className="text-muted-foreground mb-4">
                      Crie listas para organizar seus contatos em grupos específicos.
                    </p>
                    <Button onClick={() => setIsAddingList(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeira Lista
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contactLists.map((list) => (
                      <Card key={list.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{list.name}</CardTitle>
                          {list.description && (
                            <CardDescription className="text-sm">
                              {list.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                              {list.contact_count} contatos
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(list.created_at).toLocaleDateString('pt-AO')}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import">
            <CSVImport onImportComplete={fetchContacts} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Contacts;