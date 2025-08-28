import { useState, useMemo } from "react";
import { Search, Users, UserCheck, X, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  phone: string;
  phone_e164: string | null;
  email: string | null;
  tags: string[] | null;
  is_blocked: boolean;
}

interface ContactSelectorProps {
  contacts: Contact[];
  selectedContacts: Contact[];
  onSelectionChange: (contacts: Contact[]) => void;
  disabled?: boolean;
  className?: string;
}

export function ContactSelector({
  contacts,
  selectedContacts,
  onSelectionChange,
  disabled = false,
  className
}: ContactSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    contacts.forEach(contact => {
      contact.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [contacts]);

  // Filter contacts based on search and tag filter
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Skip blocked contacts
      if (contact.is_blocked) return false;

      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        contact.name.toLowerCase().includes(searchLower) ||
        contact.phone.includes(searchTerm) ||
        contact.email?.toLowerCase().includes(searchLower);

      // Tag filter
      const matchesTag = tagFilter === "all" || 
        (tagFilter === "untagged" && (!contact.tags || contact.tags.length === 0)) ||
        contact.tags?.includes(tagFilter);

      return matchesSearch && matchesTag;
    });
  }, [contacts, searchTerm, tagFilter]);

  const selectedIds = new Set(selectedContacts.map(c => c.id));

  const handleContactToggle = (contact: Contact, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedContacts, contact]);
    } else {
      onSelectionChange(selectedContacts.filter(c => c.id !== contact.id));
    }
  };

  const handleSelectAll = () => {
    const newSelections = [...selectedContacts];
    filteredContacts.forEach(contact => {
      if (!selectedIds.has(contact.id)) {
        newSelections.push(contact);
      }
    });
    onSelectionChange(newSelections);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const validContactsCount = contacts.filter(c => !c.is_blocked).length;

  return (
    <div className={className}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="w-full justify-start text-left h-auto py-3"
          >
            <div className="flex items-center gap-2 w-full">
              <Users className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                {selectedContacts.length === 0 ? (
                  <span className="text-muted-foreground">Selecionar contatos</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {selectedContacts.slice(0, 3).map(contact => (
                      <Badge key={contact.id} variant="secondary" className="text-xs">
                        {contact.name}
                      </Badge>
                    ))}
                    {selectedContacts.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{selectedContacts.length - 3} mais
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              {selectedContacts.length > 0 && (
                <Badge variant="default" className="ml-2">
                  {selectedContacts.length}
                </Badge>
              )}
            </div>
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Selecionar Contatos
              <Badge variant="outline" className="ml-auto">
                {validContactsCount} disponíveis
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Search and filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, telefone ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as tags</SelectItem>
                  <SelectItem value="untagged">Sem tags</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={filteredContacts.length === 0}
                >
                  Selecionar todos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={selectedContacts.length === 0}
                >
                  Limpar seleção
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {selectedContacts.length} de {filteredContacts.length} selecionados
              </div>
            </div>

            {/* Contacts list */}
            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-4 space-y-2">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div>Nenhum contato encontrado</div>
                    {searchTerm && (
                      <div className="text-xs mt-1">
                        Tente ajustar sua busca ou filtros
                      </div>
                    )}
                  </div>
                ) : (
                  filteredContacts.map(contact => {
                    const isSelected = selectedIds.has(contact.id);
                    
                    return (
                      <div
                        key={contact.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                          isSelected ? "bg-primary/5 border-primary/20" : "hover:bg-muted/50"
                        )}
                        onClick={() => handleContactToggle(contact, !isSelected)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleContactToggle(contact, !!checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{contact.name}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {contact.phone_e164 || contact.phone}
                          </div>
                          {contact.email && (
                            <div className="text-xs text-muted-foreground truncate">
                              {contact.email}
                            </div>
                          )}
                        </div>
                        
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {contact.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{contact.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Selected contacts summary */}
            {selectedContacts.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Contatos selecionados:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-6 px-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {selectedContacts.map(contact => (
                    <Badge
                      key={contact.id}
                      variant="secondary"
                      className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleContactToggle(contact, false)}
                    >
                      {contact.name}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}