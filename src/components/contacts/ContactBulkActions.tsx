import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Trash2, 
  MessageSquare, 
  Shield, 
  ShieldOff,
  Tag,
  Download 
} from "lucide-react";

interface ContactBulkActionsProps {
  selectedContacts: string[];
  onBulkDelete: () => void;
  onBulkSMS: () => void;
  onBulkBlock: () => void;
  onBulkUnblock: () => void;
  onBulkTag: () => void;
  onBulkExport: () => void;
  disabled?: boolean;
}

export function ContactBulkActions({
  selectedContacts,
  onBulkDelete,
  onBulkSMS,
  onBulkBlock,
  onBulkUnblock,
  onBulkTag,
  onBulkExport,
  disabled = false
}: ContactBulkActionsProps) {
  if (selectedContacts.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
      <span className="text-sm font-medium">
        {selectedContacts.length} contato{selectedContacts.length !== 1 ? 's' : ''} selecionado{selectedContacts.length !== 1 ? 's' : ''}
      </span>
      
      <div className="flex gap-2 ml-auto">
        <Button 
          size="sm" 
          variant="outline"
          onClick={onBulkSMS}
          disabled={disabled}
          className="glass-card border-glass-border"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Enviar SMS
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="sm" 
              variant="outline"
              disabled={disabled}
              className="glass-card border-glass-border"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="glass-card border-glass-border bg-background/95 backdrop-blur-lg"
          >
            <DropdownMenuItem onClick={onBulkTag}>
              <Tag className="h-4 w-4 mr-2" />
              Adicionar Tags
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBulkBlock}>
              <Shield className="h-4 w-4 mr-2" />
              Bloquear
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBulkUnblock}>
              <ShieldOff className="h-4 w-4 mr-2" />
              Desbloquear
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBulkExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Selecionados
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onBulkDelete}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}