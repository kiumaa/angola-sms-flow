import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Copy,
  FileText,
  Tag,
  Calendar,
  MessageSquare,
  MoreHorizontal
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  created_at: string;
  usage_count: number;
}

const TEMPLATE_CATEGORIES = [
  "Marketing",
  "Notificações",
  "Confirmações",
  "Lembretes",
  "Promoções",
  "Suporte"
];

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([
    {
      id: "1",
      name: "Boas-vindas",
      content: "Olá {nome}! Bem-vindo à nossa plataforma. Seu cadastro foi realizado com sucesso.",
      category: "Notificações",
      variables: ["nome"],
      created_at: "2024-01-15",
      usage_count: 245
    },
    {
      id: "2", 
      name: "Confirmação de Pedido",
      content: "Pedido #{numero_pedido} confirmado! Total: {valor}. Entrega prevista: {data_entrega}.",
      category: "Confirmações",
      variables: ["numero_pedido", "valor", "data_entrega"],
      created_at: "2024-01-10",
      usage_count: 892
    },
    {
      id: "3",
      name: "Promoção Flash",
      content: "🔥 FLASH SALE! {desconto}% OFF em todos os produtos. Código: {codigo}. Válido até {validade}!",
      category: "Promoções", 
      variables: ["desconto", "codigo", "validade"],
      created_at: "2024-01-20",
      usage_count: 1543
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    content: "",
    category: "Marketing"
  });

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/{([^}]+)}/g);
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const variables = extractVariables(newTemplate.content);
    const template: MessageTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      content: newTemplate.content,
      category: newTemplate.category,
      variables,
      created_at: new Date().toISOString().split('T')[0],
      usage_count: 0
    };

    setTemplates([...templates, template]);
    setNewTemplate({ name: "", content: "", category: "Marketing" });
    setIsCreateModalOpen(false);
    toast.success("Template criado com sucesso!");
  };

  const handleEditTemplate = () => {
    if (!editingTemplate) return;

    const variables = extractVariables(editingTemplate.content);
    const updatedTemplates = templates.map(t => 
      t.id === editingTemplate.id 
        ? { ...editingTemplate, variables }
        : t
    );

    setTemplates(updatedTemplates);
    setEditingTemplate(null);
    setIsEditModalOpen(false);
    toast.success("Template atualizado com sucesso!");
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    toast.success("Template excluído com sucesso!");
  };

  const handleDuplicateTemplate = (template: MessageTemplate) => {
    const duplicated: MessageTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Cópia)`,
      usage_count: 0,
      created_at: new Date().toISOString().split('T')[0]
    };
    setTemplates([...templates, duplicated]);
    toast.success("Template duplicado com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 bg-gradient-hero">
        <h1 className="text-3xl font-bold gradient-text mb-2 flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-primary shadow-glow">
            <FileText className="h-6 w-6 text-white" />
          </div>
          Gerenciar Templates
        </h1>
        <p className="text-muted-foreground">
          Crie e gerencie templates de mensagens para agilizar seus envios
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="Todos">Todas as categorias</option>
            {TEMPLATE_CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Template</DialogTitle>
              <DialogDescription>
                Crie um template reutilizável para suas mensagens SMS
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Template</Label>
                <Input
                  id="name"
                  placeholder="Ex: Boas-vindas"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  {TEMPLATE_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="content">Conteúdo da Mensagem</Label>
                <Textarea
                  id="content"
                  placeholder="Digite sua mensagem aqui. Use {variavel} para campos dinâmicos."
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use chaves para variáveis: {"{nome}"}, {"{valor}"}, etc.
                </p>
              </div>
              {newTemplate.content && (
                <div>
                  <Label>Variáveis Detectadas</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {extractVariables(newTemplate.content).map(variable => (
                      <Badge key={variable} variant="secondary" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTemplate}>
                Criar Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover-lift transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <Badge variant="secondary">{template.category}</Badge>
                    <Badge variant="outline" className="text-xs">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      {template.usage_count} usos
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground text-sm bg-muted/30 p-3 rounded-lg border-l-4 border-l-primary">
                    {template.content}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    {template.variables.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        <div className="flex gap-1">
                          {template.variables.map(variable => (
                            <Badge key={variable} variant="outline" className="text-xs px-1 py-0">
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => {
                        setEditingTemplate(template);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTemplates.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum template encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== "Todos" 
                ? "Tente ajustar os filtros de busca" 
                : "Comece criando seu primeiro template de mensagem"
              }
            </p>
            {!searchTerm && selectedCategory === "Todos" && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Template
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias no template
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome do Template</Label>
                <Input
                  id="edit-name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Categoria</Label>
                <select
                  id="edit-category"
                  value={editingTemplate.category}
                  onChange={(e) => setEditingTemplate({...editingTemplate, category: e.target.value})}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  {TEMPLATE_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="edit-content">Conteúdo da Mensagem</Label>
                <Textarea
                  id="edit-content"
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate({...editingTemplate, content: e.target.value})}
                  rows={4}
                />
              </div>
              {editingTemplate.content && (
                <div>
                  <Label>Variáveis Detectadas</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {extractVariables(editingTemplate.content).map(variable => (
                      <Badge key={variable} variant="secondary" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditTemplate}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}