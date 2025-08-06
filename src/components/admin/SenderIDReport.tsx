import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Search, 
  Download,
  Users,
  MessageSquare,
  Filter,
  BarChart3
} from "lucide-react";

interface SenderID {
  id: string;
  sender_id: string;
  user_id: string;
  status: string;
  bulksms_status: string;
  supported_gateways: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

interface SenderIDStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  byGateway: {
    bulksms: number;
  };
}

const SenderIDReport = () => {
  const [senderIds, setSenderIds] = useState<SenderID[]>([]);
  const [filteredSenderIds, setFilteredSenderIds] = useState<SenderID[]>([]);
  const [stats, setStats] = useState<SenderIDStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    byGateway: { bulksms: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchSenderIds();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, gatewayFilter, senderIds]);

  const fetchSenderIds = async () => {
    try {
      const { data, error } = await supabase
        .from('sender_ids')
        .select(`
          *,
          profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type assertion para contornar o problema de tipos do Supabase
      const typedData = data as unknown as SenderID[];
      setSenderIds(typedData || []);
      calculateStats(typedData || []);
    } catch (error: any) {
      console.error('Error fetching sender IDs:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: SenderID[]) => {
    const stats: SenderIDStats = {
      total: data.length,
      approved: data.filter(s => s.status === 'approved').length,
      pending: data.filter(s => s.status === 'pending').length,
      rejected: data.filter(s => s.status === 'rejected').length,
      byGateway: {
        bulksms: data.filter(s => s.supported_gateways?.includes('bulksms')).length,
      }
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = senderIds;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.sender_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Gateway filter
    if (gatewayFilter !== 'all') {
      filtered = filtered.filter(s => s.supported_gateways?.includes(gatewayFilter));
    }

    setFilteredSenderIds(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getGatewayBadges = (gateways: string[], bulksmsStatus: string) => {
    return (
      <div className="flex gap-1 flex-wrap">
        {gateways?.includes('bulksms') && (
          <Badge variant="outline" className={`text-xs ${bulksmsStatus === 'approved' ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
            BulkSMS {bulksmsStatus === 'approved' ? '✓' : '⏳'}
          </Badge>
        )}
      </div>
    );
  };

  const exportData = () => {
    const csvContent = [
      ['Sender ID', 'Usuário', 'Email', 'Status', 'BulkSMS Status', 'Gateways Suportados', 'Padrão', 'Criado em', 'Atualizado em'],
      ...filteredSenderIds.map(s => [
        s.sender_id,
        s.profiles?.full_name || '',
        s.profiles?.email || '',
        s.status,
        s.bulksms_status,
        s.supported_gateways?.join(', ') || '',
        s.is_default ? 'Sim' : 'Não',
        new Date(s.created_at).toLocaleDateString('pt-BR'),
        new Date(s.updated_at).toLocaleDateString('pt-BR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sender_ids_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejeitados</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gateway Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">BulkSMS</p>
                <p className="text-2xl font-bold text-purple-600">{stats.byGateway.bulksms}</p>
                <p className="text-xs text-muted-foreground">Sender IDs configurados</p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Relatório de Sender IDs</CardTitle>
              <CardDescription>
                Lista detalhada de todos os Sender IDs e seus status
              </CardDescription>
            </div>
            <Button onClick={exportData} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por Sender ID, nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por gateway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os gateways</SelectItem>
                <SelectItem value="bulksms">BulkSMS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender ID</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gateways</TableHead>
                  <TableHead>Padrão</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Atualizado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSenderIds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum Sender ID encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSenderIds.map((senderId) => (
                    <TableRow key={senderId.id}>
                      <TableCell>
                        <div className="font-medium">{senderId.sender_id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{senderId.profiles?.full_name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{senderId.profiles?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(senderId.status)}
                      </TableCell>
                      <TableCell>
                        {getGatewayBadges(senderId.supported_gateways, senderId.bulksms_status)}
                      </TableCell>
                      <TableCell>
                        {senderId.is_default && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Padrão
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(senderId.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(senderId.created_at).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(senderId.updated_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(senderId.updated_at).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Rodapé com informações */}
          <div className="mt-4 text-sm text-muted-foreground">
            Mostrando {filteredSenderIds.length} de {stats.total} Sender IDs
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SenderIDReport;