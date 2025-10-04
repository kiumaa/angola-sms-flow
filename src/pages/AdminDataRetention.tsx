import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database, Trash2, Calendar, CheckCircle, AlertTriangle, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RetentionPolicy {
  id: string;
  table_name: string;
  retention_days: number;
  status_filter: string[] | null;
  date_column: string;
  is_active: boolean;
  last_cleanup_at: string | null;
  records_cleaned_last_run: number;
  description: string | null;
}

const AdminDataRetention = () => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchPolicies();
    }
  }, [isAdmin]);

  const fetchPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('data_retention_policies')
        .select('*')
        .order('table_name');

      if (error) throw error;
      setPolicies(data || []);
    } catch (error: any) {
      console.error('Error fetching policies:', error);
      toast({
        title: "Erro ao carregar políticas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runCleanup = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-otps');

      if (error) throw error;

      toast({
        title: "Limpeza executada",
        description: `${data.result?.total_deleted || 0} registros removidos`,
      });

      fetchPolicies();
    } catch (error: any) {
      console.error('Error running cleanup:', error);
      toast({
        title: "Erro ao executar limpeza",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca executado';
    return new Date(date).toLocaleString('pt-BR');
  };

  const getDaysColor = (days: number) => {
    if (days <= 7) return 'text-red-600 dark:text-red-400';
    if (days <= 30) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando políticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Políticas de Retenção de Dados</h1>
          <p className="text-muted-foreground">
            Gerencie a retenção automática de dados para conformidade LGPD
          </p>
        </div>
        <Button onClick={runCleanup} disabled={running}>
          {running ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              Executando...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Executar Limpeza
            </>
          )}
        </Button>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          As políticas de retenção são executadas automaticamente conforme agendado. 
          A execução manual é útil para testes ou limpeza imediata.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Políticas Ativas
          </CardTitle>
          <CardDescription>
            Configurações de retenção para cada tabela do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tabela</TableHead>
                <TableHead>Retenção</TableHead>
                <TableHead>Filtro de Status</TableHead>
                <TableHead>Última Execução</TableHead>
                <TableHead>Registros Removidos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Descrição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium">
                    {policy.table_name}
                  </TableCell>
                  <TableCell>
                    <span className={getDaysColor(policy.retention_days)}>
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {policy.retention_days} dias
                    </span>
                  </TableCell>
                  <TableCell>
                    {policy.status_filter ? (
                      <div className="flex flex-wrap gap-1">
                        {policy.status_filter.map((status, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {status}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Todos</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(policy.last_cleanup_at)}
                  </TableCell>
                  <TableCell>
                    {policy.records_cleaned_last_run > 0 ? (
                      <Badge variant="secondary">
                        <Trash2 className="h-3 w-3 mr-1" />
                        {policy.records_cleaned_last_run}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {policy.is_active ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativa
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inativa</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm text-muted-foreground truncate" title={policy.description || ''}>
                      {policy.description || '-'}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agendamento Automático</CardTitle>
          <CardDescription>
            As limpezas são executadas automaticamente nos seguintes intervalos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">OTP Requests</h3>
              <p className="text-sm text-muted-foreground">A cada hora</p>
              <Badge variant="outline" className="mt-2">Horário</Badge>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Campanhas</h3>
              <p className="text-sm text-muted-foreground">Diariamente</p>
              <Badge variant="outline" className="mt-2">Diário</Badge>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">SMS Logs</h3>
              <p className="text-sm text-muted-foreground">Semanalmente</p>
              <Badge variant="outline" className="mt-2">Semanal</Badge>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">LGPD Requests</h3>
              <p className="text-sm text-muted-foreground">Diariamente</p>
              <Badge variant="outline" className="mt-2">Diário</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDataRetention;
