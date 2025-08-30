import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPhoneForDisplay } from "@/lib/phoneNormalization";
import { 
  User, 
  Phone, 
  Mail, 
  Building, 
  Calendar, 
  Shield,
  ShieldOff,
  MessageSquare,
  Edit
} from "lucide-react";
import { format } from 'date-fns';

interface Contact {
  id: string;
  name: string;
  phone_e164: string;
  email?: string;
  attributes: Record<string, any>;
  is_blocked: boolean;
  created_at: string;
  tags?: string[];
}

interface ContactViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  onEdit: (contact: Contact) => void;
  onToggleBlock: (contactId: string, blocked: boolean) => void;
  onSendSMS: (contact: Contact) => void;
  onSendEmail?: (contact: Contact) => void;
}

export default function ContactViewModal({
  open,
  onOpenChange,
  contact,
  onEdit,
  onToggleBlock,
  onSendSMS,
  onSendEmail
}: ContactViewModalProps) {
  if (!contact) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-gradient-primary shadow-glow">
              <User className="h-5 w-5 text-white" />
            </div>
            {contact.name || 'Contato sem nome'}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos do contato
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge 
                variant={contact.is_blocked ? "destructive" : "default"}
                className="flex items-center gap-1"
              >
                {contact.is_blocked ? (
                  <Shield className="h-3 w-3" />
                ) : (
                  <ShieldOff className="h-3 w-3" />
                )}
                {contact.is_blocked ? 'Bloqueado' : 'Ativo'}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(contact)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendSMS(contact)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Enviar SMS
              </Button>
              {contact.email && onSendEmail && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSendEmail(contact)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Email
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações Básicas
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="text-sm">{contact.name || 'Não informado'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                  <p className="text-sm font-mono">{formatPhoneForDisplay(contact.phone_e164)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-sm">{contact.email || 'Não informado'}</p>
                </div>
                
                {contact.attributes.company && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                    <p className="text-sm flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {contact.attributes.company}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Informações do Sistema
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                  <p className="text-sm">{format(new Date(contact.created_at), 'dd/MM/yyyy - HH:mm')}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID</label>
                  <p className="text-xs font-mono text-muted-foreground">{contact.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="space-y-3">
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Additional Attributes */}
          {Object.keys(contact.attributes).length > 0 && (
            <div className="space-y-3">
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Atributos Personalizados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(contact.attributes).map(([key, value]) => (
                    key !== 'company' && (
                      <div key={key}>
                        <label className="text-sm font-medium text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </label>
                        <p className="text-sm">{String(value)}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              variant={contact.is_blocked ? "default" : "destructive"}
              onClick={() => onToggleBlock(contact.id, !contact.is_blocked)}
            >
              {contact.is_blocked ? (
                <>
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Desbloquear Contato
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Bloquear Contato
                </>
              )}
            </Button>
            
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}