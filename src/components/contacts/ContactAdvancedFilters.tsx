import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Filter, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ContactFilters {
  status?: 'all' | 'active' | 'blocked';
  tags?: string[];
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
  hasEmail?: boolean;
  hasPhone?: boolean;
}

interface ContactAdvancedFiltersProps {
  filters: ContactFilters;
  onFiltersChange: (filters: ContactFilters) => void;
  availableTags?: { id: string; name: string; color: string }[];
  onReset: () => void;
}

export function ContactAdvancedFilters({
  filters,
  onFiltersChange,
  availableTags = [],
  onReset
}: ContactAdvancedFiltersProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status === 'all' ? undefined : status as 'active' | 'blocked'
    });
  };

  const handleTagToggle = (tagId: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    
    onFiltersChange({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined
    });
  };

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        from: range.from || null,
        to: range.to || null
      }
    });
  };

  const hasActiveFilters = filters.status || filters.tags?.length || filters.dateRange?.from || filters.hasEmail !== undefined || filters.hasPhone !== undefined;

  return (
    <Card className="card-futuristic">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="gradient-text flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onReset}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status</Label>
          <Select onValueChange={handleStatusChange} value={filters.status || 'all'}>
            <SelectTrigger className="glass-card border-glass-border">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent className="glass-card border-glass-border bg-background/95 backdrop-blur-lg">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="blocked">Bloqueados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tags Filter */}
        {availableTags.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={filters.tags?.includes(tag.id) ? "default" : "outline"}
                  className="cursor-pointer transition-all hover:scale-105"
                  style={{
                    backgroundColor: filters.tags?.includes(tag.id) ? tag.color : 'transparent',
                    borderColor: tag.color,
                    color: filters.tags?.includes(tag.id) ? 'white' : tag.color
                  }}
                  onClick={() => handleTagToggle(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Data de Criação</Label>
          <Popover open={showCalendar} onOpenChange={setShowCalendar}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal glass-card border-glass-border"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange?.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                      {format(filters.dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                    </>
                  ) : (
                    format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                  )
                ) : (
                  "Selecionar período"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto p-0 glass-card border-glass-border bg-background/95 backdrop-blur-lg" 
              align="start"
            >
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filters.dateRange?.from || undefined}
                selected={{
                  from: filters.dateRange?.from || undefined,
                  to: filters.dateRange?.to || undefined
                }}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Contact Type Filters */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tipo de Contato</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasEmail"
                checked={filters.hasEmail || false}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  hasEmail: e.target.checked ? true : undefined
                })}
                className="rounded border-glass-border"
              />
              <Label htmlFor="hasEmail" className="text-sm">Com email</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasPhone"
                checked={filters.hasPhone || false}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  hasPhone: e.target.checked ? true : undefined
                })}
                className="rounded border-glass-border"
              />
              <Label htmlFor="hasPhone" className="text-sm">Com telefone</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}