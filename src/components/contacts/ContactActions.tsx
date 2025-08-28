import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  UserX, 
  UserCheck,
  MessageSquare,
  Mail
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  phone_e164: string | null;
  email: string | null;
  is_blocked: boolean;
}

interface ContactActionsProps {
  contact: Contact;
  onView: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
  onToggleBlock: (contactId: string, isBlocked: boolean) => void;
  onSendSMS: (contact: Contact) => void;
  onSendEmail?: (contact: Contact) => void;
}

export function ContactActions({
  contact,
  onView,
  onEdit,
  onDelete,
  onToggleBlock,
  onSendSMS,
  onSendEmail
}: ContactActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 hover:bg-muted/50"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card border-glass-border">
        <DropdownMenuItem 
          onClick={() => onView(contact)}
          className="cursor-pointer"
        >
          <Eye className="mr-2 h-4 w-4" />
          Ver Detalhes
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => onEdit(contact)}
          className="cursor-pointer"
        >
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => onSendSMS(contact)}
          className="cursor-pointer"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Enviar SMS
        </DropdownMenuItem>
        
        {contact.email && onSendEmail && (
          <DropdownMenuItem 
            onClick={() => onSendEmail(contact)}
            className="cursor-pointer"
          >
            <Mail className="mr-2 h-4 w-4" />
            Enviar Email
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => onToggleBlock(contact.id, contact.is_blocked)}
          className="cursor-pointer"
        >
          {contact.is_blocked ? (
            <>
              <UserCheck className="mr-2 h-4 w-4 text-green-500" />
              Desbloquear
            </>
          ) : (
            <>
              <UserX className="mr-2 h-4 w-4 text-orange-500" />
              Bloquear
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => onDelete(contact.id)}
          className="cursor-pointer text-red-500 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}