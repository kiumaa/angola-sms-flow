import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, Plus, Tag } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { formatPhoneForDisplay } from "@/lib/phoneNormalization";

interface Contact {
  id: string;
  name: string;
  phone_e164: string | null;
  tags: string[] | null;
}

interface ContactSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactsSelected: (contacts: Contact[]) => void;
  selectedPhones?: string[];
}

export const ContactSelectionModal = ({ 
  open, 
  onOpenChange, 
  onContactsSelected,
  selectedPhones = []
}: ContactSelectionModalProps) => {
  const { contacts, loading, searchContacts } = useContacts();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);

  // Filter contacts based on search query
  useEffect(() => {
    if (!contacts) return;

    let filtered = contacts.filter(contact => 
      contact.phone_e164 && // Only contacts with valid phones
      contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredContacts(filtered);
  }, [contacts, searchQuery]);

  // Handle search input
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchContacts(query);
    }
  };

  const handleContactSelect = (contactId: string, checked: boolean) => {
    const newSelected = new Set(selectedContacts);
    if (checked) {
      newSelected.add(contactId);
    } else {
      newSelected.delete(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const handleAddSelected = () => {
    const contactsToAdd = filteredContacts.filter(c => selectedContacts.has(c.id));
    onContactsSelected(contactsToAdd);
    setSelectedContacts(new Set());
    onOpenChange(false);
  };

  const isContactAlreadySelected = (phone: string) => {
    return selectedPhones.includes(phone);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Selecionar Contatos
          </DialogTitle>
          <DialogDescription>
            Escolha contatos da sua lista para adicionar aos destinatários
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                {filteredContacts.length} contatos encontrados
              </span>
            </div>
            {selectedContacts.size > 0 && (
              <Badge variant="secondary">
                {selectedContacts.size} selecionados
              </Badge>
            )}
          </div>

          {/* Contacts list */}
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando contatos...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Nenhum contato encontrado</p>
                  <Button variant="link" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Criar contato
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedContacts.has(contact.id);
                  const isAlreadyAdded = contact.phone_e164 && isContactAlreadySelected(contact.phone_e164);
                  
                  return (
                    <div key={contact.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50">
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={(checked) => handleContactSelect(contact.id, checked as boolean)}
                        disabled={isAlreadyAdded}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{contact.name}</span>
                          {isAlreadyAdded && (
                            <Badge variant="outline" className="text-xs">
                              Já adicionado
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-mono">
                            {contact.phone_e164 ? formatPhoneForDisplay(contact.phone_e164) : 'Sem telefone'}
                          </span>
                        </div>
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {contact.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                            {contact.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{contact.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleAddSelected} 
              disabled={selectedContacts.size === 0}
              className="flex-1"
            >
              Adicionar {selectedContacts.size} selecionados
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};