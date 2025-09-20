import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPhoneForDisplay } from "@/lib/phoneNormalization";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Tag,
  Search,
  Shield,
  ShieldOff,
  MessageSquare,
  Phone,
  Users
} from "lucide-react";
import { format } from 'date-fns';

interface Contact {
  id: string;
  name: string;
  phone: string;
  phone_e164?: string;
  email?: string;
  attributes: Record<string, any>;
  is_blocked: boolean;
  created_at: string;
  tags?: string[];
}

interface ContactTableProps {
  contacts: Contact[];
  selectedContacts: string[];
  onSelectContact: (contactId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contactId: string) => void;
  onToggleBlock: (contactId: string, blocked: boolean) => void;
  loading?: boolean;
}

export default function ContactTable({
  contacts,
  selectedContacts,
  onSelectContact,
  onSelectAll,
  onEditContact,
  onDeleteContact,
  onToggleBlock,
  loading = false
}: ContactTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatPhoneForDisplay(contact.phone_e164).includes(searchTerm)
  );

  const allSelected = selectedContacts.length === filteredContacts.length && filteredContacts.length > 0;
  const someSelected = selectedContacts.length > 0 && selectedContacts.length < filteredContacts.length;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar contatos por nome ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Selection Info */}
      {selectedContacts.length > 0 && (
        <div className="bg-primary/10 p-3 rounded-lg">
          <span className="text-sm font-medium">
            {selectedContacts.length} contato{selectedContacts.length !== 1 ? 's' : ''} selecionado{selectedContacts.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Carregando contatos...
                </TableCell>
              </TableRow>
            ) : filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {contacts.length === 0 ? 'Nenhum contato encontrado' : 'Nenhum contato corresponde à busca'}
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={(checked) => onSelectContact(contact.id, !!checked)}
                    />
                  </TableCell>
                   <TableCell>
                     <div className="flex items-center gap-3">
                       <div className="p-2 rounded-2xl bg-gradient-primary shadow-glow">
                         <Users className="h-4 w-4 text-white" />
                       </div>
                       <div>
                         <div className="font-medium">{contact.name}</div>
                         {contact.attributes?.company && (
                           <div className="text-sm text-muted-foreground">
                             {contact.attributes.company}
                           </div>
                         )}
                       </div>
                     </div>
                   </TableCell>
                   <TableCell>
                     <div className="flex items-center gap-2">
                       <Phone className="h-4 w-4 text-muted-foreground" />
                       <span className="font-mono text-sm">
                         {contact.phone_e164 ? formatPhoneForDisplay(contact.phone_e164) : contact.phone}
                       </span>
                     </div>
                   </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                       {contact.tags?.map((tag, index) => (
                         <Badge
                           key={index}
                           variant="secondary"
                         >
                           {tag}
                         </Badge>
                       ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.is_blocked ? (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Bloqueado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-800">
                        <ShieldOff className="h-3 w-3" />
                        Ativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(contact.created_at), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditContact(contact)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleBlock(contact.id, !contact.is_blocked)}>
                          {contact.is_blocked ? (
                            <>
                              <ShieldOff className="h-4 w-4 mr-2" />
                              Desbloquear
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-2" />
                              Bloquear
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteContact(contact.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}