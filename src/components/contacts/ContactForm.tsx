import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { normalizePhoneAngola, formatPhoneForDisplay } from "@/lib/phoneNormalization";
import { X, Plus } from "lucide-react";

interface Contact {
  id?: string;
  name: string;
  phone_e164: string;
  attributes: Record<string, any>;
  tags?: { id: string; name: string; color: string }[];
}

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  onSave: (contact: Omit<Contact, 'id'>) => Promise<void>;
  availableTags?: { id: string; name: string; color: string }[];
}

export default function ContactForm({
  open,
  onOpenChange,
  contact,
  onSave,
  availableTags = []
}: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    notes: ''
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customAttributes, setCustomAttributes] = useState<Record<string, string>>({});
  const [phoneError, setPhoneError] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name || '',
        phone: formatPhoneForDisplay(contact.phone_e164) || '',
        email: contact.attributes?.email || '',
        company: contact.attributes?.company || '',
        notes: contact.attributes?.notes || ''
      });
      setSelectedTags(contact.tags?.map(t => t.id) || []);
      
      // Extract custom attributes (excluding known ones)
      const knownFields = ['email', 'company', 'notes'];
      const custom = Object.entries(contact.attributes || {})
        .filter(([key]) => !knownFields.includes(key))
        .reduce((acc, [key, value]) => ({
          ...acc,
          [key]: String(value)
        }), {});
      setCustomAttributes(custom);
    } else {
      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        company: '',
        notes: ''
      });
      setSelectedTags([]);
      setCustomAttributes({});
    }
    setPhoneError('');
  }, [contact, open]);

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, phone: value });
    
    if (value.trim()) {
      const result = normalizePhoneAngola(value);
      if (!result.ok) {
        setPhoneError('Número de telefone inválido para Angola');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  };

  const addCustomAttribute = () => {
    const key = prompt('Nome do campo:');
    if (key && !customAttributes[key]) {
      setCustomAttributes({
        ...customAttributes,
        [key]: ''
      });
    }
  };

  const removeCustomAttribute = (key: string) => {
    const newAttrs = { ...customAttributes };
    delete newAttrs[key];
    setCustomAttributes(newAttrs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e telefone são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const phoneResult = normalizePhoneAngola(formData.phone);
    if (!phoneResult.ok) {
      setPhoneError('Número de telefone inválido para Angola');
      return;
    }

    setSaving(true);
    
    try {
      const attributes: Record<string, any> = {
        ...customAttributes
      };
      
      if (formData.email.trim()) attributes.email = formData.email.trim();
      if (formData.company.trim()) attributes.company = formData.company.trim();
      if (formData.notes.trim()) attributes.notes = formData.notes.trim();

      await onSave({
        name: formData.name.trim(),
        phone_e164: phoneResult.e164!,
        attributes,
        tags: availableTags.filter(tag => selectedTags.includes(tag.id))
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {contact ? 'Editar Contato' : 'Novo Contato'}
          </DialogTitle>
          <DialogDescription>
            {contact ? 'Edite as informações do contato.' : 'Adicione um novo contato à sua lista.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
                required
                aria-label="Nome do contato (obrigatório)"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="923456789"
                className={phoneError ? 'border-destructive' : ''}
                required
                aria-label="Número de telefone (obrigatório)"
                aria-describedby={phoneError ? "phone-error" : undefined}
              />
              {phoneError && (
                <p id="phone-error" className="text-sm text-destructive mt-1" role="alert">
                  {phoneError}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                aria-label="Endereço de email"
              />
            </div>
            
            <div>
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Nome da empresa"
              />
            </div>
          </div>

          {/* Tags */}
          {availableTags.length > 0 && (
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    style={selectedTags.includes(tag.id) ? {
                      backgroundColor: tag.color,
                      borderColor: tag.color
                    } : {
                      borderColor: tag.color,
                      color: tag.color
                    }}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          {/* Custom Attributes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Campos Personalizados</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomAttribute}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Campo
              </Button>
            </div>
            
            {Object.entries(customAttributes).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 mb-2">
                <Input
                  placeholder="Nome do campo"
                  value={key}
                  disabled
                  className="flex-1"
                />
                <Input
                  placeholder="Valor"
                  value={value}
                  onChange={(e) => setCustomAttributes({
                    ...customAttributes,
                    [key]: e.target.value
                  })}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeCustomAttribute(key)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              aria-label="Cancelar edição do contato"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={saving}
              aria-label={saving ? 'Salvando contato...' : contact ? 'Salvar alterações do contato' : 'Criar novo contato'}
            >
              {saving ? 'Salvando...' : contact ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}