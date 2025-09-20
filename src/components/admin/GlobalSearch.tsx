import { useState, useEffect, useRef } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Users, MessageSquare, Settings, DollarSign, BarChart3, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  icon: React.ComponentType<any>;
}

const SEARCH_DATA: SearchResult[] = [
  // Dashboard
  { id: 'dashboard', title: 'Dashboard', description: 'Visão geral da plataforma', category: 'Principal', url: '/admin', icon: BarChart3 },
  
  // Usuários
  { id: 'users', title: 'Usuários', description: 'Gerenciar usuários da plataforma', category: 'Usuários', url: '/admin/users', icon: Users },
  { id: 'users-create', title: 'Criar Usuário', description: 'Adicionar novo usuário', category: 'Usuários', url: '/admin/users?action=create', icon: Users },
  
  // SMS & Comunicação
  { id: 'sms-config', title: 'Configurações SMS', description: 'Configurar gateways de SMS', category: 'SMS', url: '/admin/sms-configuration', icon: Settings },
  { id: 'sender-ids', title: 'Sender IDs', description: 'Gerenciar IDs de remetente', category: 'SMS', url: '/admin/sender-ids', icon: MessageSquare },
  { id: 'sms-test', title: 'Teste SMS', description: 'Testar envio de SMS', category: 'SMS', url: '/admin/sms-test', icon: Zap },
  { id: 'sms-monitoring', title: 'Monitoramento SMS', description: 'Monitorar status dos gateways', category: 'SMS', url: '/admin/sms-monitoring', icon: MessageSquare },
  { id: 'gateway-control', title: 'Controle de Gateways', description: 'Controlar roteamento de gateways', category: 'SMS', url: '/admin/gateway-control', icon: Settings },
  
  // Financeiro
  { id: 'financeiro', title: 'Painel Financeiro', description: 'Visão geral financeira', category: 'Financeiro', url: '/admin/financeiro', icon: DollarSign },
  { id: 'packages', title: 'Pacotes de Créditos', description: 'Gerenciar pacotes de créditos', category: 'Financeiro', url: '/admin/packages', icon: DollarSign },
  { id: 'transactions', title: 'Transações', description: 'Histórico de transações', category: 'Financeiro', url: '/admin/transactions', icon: DollarSign },
  { id: 'credit-requests', title: 'Pedidos de Créditos', description: 'Gerenciar pedidos de créditos', category: 'Financeiro', url: '/admin/credit-requests', icon: DollarSign },
  
  // Relatórios
  { id: 'reports', title: 'Relatórios', description: 'Relatórios e analytics', category: 'Relatórios', url: '/admin/reports', icon: BarChart3 },
  
  // Sistema
  { id: 'branding', title: 'Personalização', description: 'Configurar marca e visual', category: 'Sistema', url: '/admin/brand', icon: Settings },
  { id: 'production', title: 'Produção', description: 'Monitoramento de produção', category: 'Sistema', url: '/admin/production', icon: Settings },
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Principal': return BarChart3;
    case 'Usuários': return Users;
    case 'SMS': return MessageSquare;
    case 'Financeiro': return DollarSign;
    case 'Relatórios': return BarChart3;
    case 'Sistema': return Settings;
    default: return Search;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Principal': return 'bg-blue-500/10 text-blue-600 border-blue-200';
    case 'Usuários': return 'bg-green-500/10 text-green-600 border-green-200';
    case 'SMS': return 'bg-purple-500/10 text-purple-600 border-purple-200';
    case 'Financeiro': return 'bg-orange-500/10 text-orange-600 border-orange-200';
    case 'Relatórios': return 'bg-indigo-500/10 text-indigo-600 border-indigo-200';
    case 'Sistema': return 'bg-gray-500/10 text-gray-600 border-gray-200';
    default: return 'bg-muted text-muted-foreground';
  }
};

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const filteredResults = SEARCH_DATA.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.description.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const groupedResults = filteredResults.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as Record<string, SearchResult[]>);

  const handleSelect = (url: string) => {
    onOpenChange(false);
    setQuery("");
    navigate(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl">
        <Command className="rounded-lg border-0 shadow-none">
          <CommandInput
            ref={inputRef}
            placeholder="Buscar páginas, configurações, usuários..."
            value={query}
            onValueChange={setQuery}
            className="border-0 focus:ring-0 text-base py-4"
          />
          <CommandList className="max-h-96 p-2">
            <CommandEmpty className="text-center py-8 text-muted-foreground">
              <div className="space-y-2">
                <Search className="h-8 w-8 mx-auto opacity-50" />
                <p>Nenhum resultado encontrado para "{query}"</p>
                <p className="text-sm">Tente buscar por páginas, configurações ou funcionalidades</p>
              </div>
            </CommandEmpty>
            
            {Object.entries(groupedResults).map(([category, items]) => {
              const CategoryIcon = getCategoryIcon(category);
              return (
                <CommandGroup key={category} heading={
                  <div className="flex items-center space-x-2 py-2">
                    <CategoryIcon className="h-4 w-4" />
                    <span>{category}</span>
                  </div>
                }>
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`${item.title} ${item.description} ${item.category}`}
                      onSelect={() => handleSelect(item.url)}
                      className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer"
                    >
                      <div className="p-2 rounded-lg bg-muted/50">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                      </div>
                      <Badge variant="outline" className={cn("text-xs", getCategoryColor(category))}>
                        {category}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};