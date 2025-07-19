import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Upload, Download, Search, Users, FileText, Trash2, Edit, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import CSVImport from "@/components/contacts/CSVImport";

const Contacts = () => {
  const [contacts, setContacts] = useState([]);
  const [contactLists, setContactLists] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const mockContactLists = [
    {
      id: "1",
      name: "Todos os Contatos",
      description: "Lista principal com todos os contatos",
      contactCount: 1250,
      createdAt: "2024-01-10T10:00:00Z"
    },
    {
      id: "2",
      name: "Clientes Ativos",
      description: "Clientes que fizeram compras nos últimos 6 meses",
      contactCount: 850,
      createdAt: "2024-01-15T14:30:00Z"
    },
    {
      id: "3",
      name: "Prospects",
      description: "Leads interessados nos produtos",
      contactCount: 350,
      createdAt: "2024-01-20T09:15:00Z"
    },
    {
      id: "4",
      name: "Clientes VIP",
      description: "Clientes premium com alto valor",
      contactCount: 120,
      createdAt: "2024-01-12T16:45:00Z"
    }
  ];

  const mockContacts = [
    {
      id: "1",
      name: "João Silva",
      phone: "+244 900 123 456",
      email: "joao@empresa.ao",
      tags: ["Cliente", "VIP"],
      lists: ["Clientes Ativos", "Clientes VIP"],
      createdAt: "2024-01-10T10:00:00Z"
    },
    {
      id: "2",
      name: "Maria Santos",
      phone: "+244 900 789 012",
      email: "maria@negocio.ao",
      tags: ["Prospect", "Hot Lead"],
      lists: ["Prospects"],
      createdAt: "2024-01-15T14:30:00Z"
    },
    {
      id: "3",
      name: "Carlos Mendes",
      phone: "+244 900 345 678",
      email: "carlos@tech.ao",
      tags: ["Cliente", "Tecnologia"],
      lists: ["Clientes Ativos"],
      createdAt: "2024-01-20T09:15:00Z"
    }
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setContactLists(mockContactLists);
      setContacts(mockContacts);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteContact = (contactId: string) => {
    setContacts(contacts.filter(c => c.id !== contactId));
    toast({
      title: "Contato removido",
      description: "O contato foi removido com sucesso.",
    });
  };

  const handleImportSuccess = (importedContacts: any[]) => {
    setContacts([...contacts, ...importedContacts]);
    setShowImport(false);
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
                onClick={() => {/* Add new contact logic */}}
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
                  <Button variant="outline" className="glass-card border-glass-border">
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
                  {filteredContacts.length} contatos encontrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="p-6 rounded-3xl bg-gradient-primary/10 w-fit mx-auto mb-6">
                      <Users className="h-12 w-12 text-primary mx-auto" />
                    </div>
                    <h3 className="text-xl font-normal mb-2">
                      {searchTerm ? "Nenhum contato encontrado" : "Nenhum contato ainda"}
                    </h3>
                    <p className="text-muted-foreground mb-8">
                      {searchTerm 
                        ? "Tente buscar com outros termos." 
                        : "Importe ou adicione contatos para começar suas campanhas."
                      }
                    </p>
                    {!searchTerm && (
                      <Button 
                        className="button-futuristic" 
                        onClick={() => setShowImport(true)}
                      >
                        Importar Contatos
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-glass-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20">
                          <TableHead>Nome</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Tags</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredContacts.map((contact) => (
                          <TableRow key={contact.id} className="hover:bg-muted/10">
                            <TableCell className="font-medium">{contact.name}</TableCell>
                            <TableCell>{contact.phone}</TableCell>
                            <TableCell>{contact.email}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {contact.tags?.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="glass-card border-glass-border">
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button variant="outline" size="sm" className="glass-card border-glass-border">
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="glass-card border-glass-border text-red-500 hover:text-red-700"
                                  onClick={() => handleDeleteContact(contact.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
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
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle className="gradient-text">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Contatos:</span>
                  <span className="font-bold text-primary">1.250</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Listas Ativas:</span>
                  <span className="font-bold">4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adicionados hoje:</span>
                  <span className="font-bold text-green-500">+12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de engajamento:</span>
                  <span className="font-bold text-blue-500">94.5%</span>
                </div>
              </CardContent>
            </Card>

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
                            {list.contactCount} contatos
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {list.contactCount}
                      </Badge>
                    </div>
                  </Card>
                ))}
                
                <Button 
                  variant="outline" 
                  className="w-full glass-card border-glass-border border-dashed hover:border-primary"
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

        {/* CSV Import Modal */}
        {showImport && (
          <CSVImport 
            isOpen={showImport}
            onClose={() => setShowImport(false)}
            onSuccess={handleImportSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  );
};
export default Contacts;