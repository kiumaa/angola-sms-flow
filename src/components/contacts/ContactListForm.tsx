import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ContactListFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
  list?: {
    id: string;
    name: string;
    description?: string;
  } | null;
}

export default function ContactListForm({
  open,
  onOpenChange,
  onSave,
  list = null
}: ContactListFormProps) {
  const [name, setName] = useState(list?.name || '');
  const [description, setDescription] = useState(list?.description || '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para a lista.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get account_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Perfil não encontrado');

      const listData = {
        name: name.trim(),
        description: description.trim() || null,
        account_id: profile.id,
        user_id: user.id,
        rule: { all: [] } // Default rule structure
      };

      if (list?.id) {
        // Update existing list
        const { error } = await supabase
          .from('contact_lists')
          .update(listData)
          .eq('id', list.id);

        if (error) throw error;

        toast({
          title: "Lista atualizada",
          description: "A lista foi atualizada com sucesso.",
        });
      } else {
        // Create new list
        const { error } = await supabase
          .from('contact_lists')
          .insert([listData]);

        if (error) throw error;

        toast({
          title: "Lista criada",
          description: "Nova lista de contatos criada com sucesso.",
        });
      }

      // Reset form
      setName('');
      setDescription('');
      onOpenChange(false);
      
      if (onSave) {
        onSave();
      }
    } catch (error: any) {
      console.error('Erro ao salvar lista:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar a lista.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setName(list?.name || '');
      setDescription(list?.description || '');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {list ? 'Editar Lista' : 'Nova Lista de Contatos'}
          </DialogTitle>
          <DialogDescription>
            {list 
              ? 'Atualize as informações da lista de contatos.'
              : 'Crie uma nova lista para organizar seus contatos.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Lista *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Clientes VIP, Newsletter..."
              disabled={saving}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito desta lista..."
              disabled={saving}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {list ? 'Atualizar' : 'Criar Lista'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}