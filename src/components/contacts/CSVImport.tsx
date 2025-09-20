import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Upload, Download, CheckCircle } from "lucide-react";

interface CSVImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

const CSVImport = ({ open, onOpenChange, onImportComplete }: CSVImportProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<{ name?: number; phone?: number; email?: number }>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const text = await uploadedFile.text();
    
    // Parse CSV
    const lines = text.split('\n').filter(line => line.trim());
    const data = lines.map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
    
    setCsvData(data);
    setColumns(data[0] || []);
  };

  const handleImport = async () => {
    if (!csvData.length || !mapping.name || !mapping.phone) {
      toast({
        title: "Mapeamento incompleto",
        description: "Por favor, mapeie pelo menos Nome e Telefone",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Get user profile for account_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error("Perfil do usuário não encontrado");
      }

      const contacts = csvData.slice(1).map(row => ({
        user_id: user.id,
        account_id: profile.id,
        name: row[mapping.name!] || '',
        phone: row[mapping.phone!] || '',
        phone_e164: row[mapping.phone!] || '', // Will be normalized
        email: mapping.email !== undefined ? row[mapping.email] : null,
        attributes: {},
        is_blocked: false
      })).filter(contact => contact.name && contact.phone);

      if (contacts.length === 0) {
        throw new Error("Nenhum contato válido encontrado");
      }

      const { error } = await supabase
        .from('contacts')
        .insert(contacts);

      if (error) throw error;

      toast({
        title: "Importação concluída!",
        description: `${contacts.length} contatos importados com sucesso`,
      });

      onImportComplete();
      setFile(null);
      setCsvData([]);
      setColumns([]);
      setMapping({});

    } catch (error: any) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = "Nome,Telefone,Email\nJoão Silva,923456789,joao@email.com\nMaria Santos,924567890,maria@email.com";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_contatos.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Importar Contatos via CSV
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Download Template */}
          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
            <div>
              <h4 className="font-medium text-blue-900">Precisa de um modelo?</h4>
              <p className="text-blue-700 text-sm">Baixe nosso template CSV</p>
            </div>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Template
            </Button>
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="csv-file">Arquivo CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="mt-2"
            />
          </div>

          {/* Column Mapping */}
          {columns.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium">Mapeamento de Colunas</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Nome *</Label>
                  <Select onValueChange={(value) => setMapping({ ...mapping, name: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((col, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Telefone *</Label>
                  <Select onValueChange={(value) => setMapping({ ...mapping, phone: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((col, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Email (opcional)</Label>
                  <Select onValueChange={(value) => setMapping({ ...mapping, email: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((col, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview */}
              {csvData.length > 1 && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2">Preview (primeiros 3 registros)</h5>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 text-left">Nome</th>
                          <th className="p-2 text-left">Telefone</th>
                          <th className="p-2 text-left">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvData.slice(1, 4).map((row, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{mapping.name !== undefined ? row[mapping.name] : '-'}</td>
                            <td className="p-2">{mapping.phone !== undefined ? row[mapping.phone] : '-'}</td>
                            <td className="p-2">{mapping.email !== undefined ? row[mapping.email] : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleImport}
                disabled={loading || !mapping.name || !mapping.phone}
                className="w-full"
              >
                {loading ? "Importando..." : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Importar {csvData.length - 1} Contatos
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSVImport;