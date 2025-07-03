import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";
import { CheckCircle, AlertTriangle, Download, Upload, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CSVImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (contacts: any[]) => void;
}

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  [csvColumn: string]: string;
}

const requiredFields = {
  name: "Nome",
  phone: "Telefone",
  email: "Email (opcional)"
};

const optionalFields = {
  tags: "Tags",
  notes: "Notas",
  company: "Empresa"
};

export function CSVImport({ isOpen, onClose, onImport }: CSVImportProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'validation' | 'preview'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const parseCSV = async (file: File) => {
    return new Promise<{ headers: string[], data: CSVRow[] }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('O arquivo deve conter pelo menos um cabeçalho e uma linha de dados'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
          const data = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
            const row: CSVRow = {};
            headers.forEach((header, i) => {
              row[header] = values[i] || '';
            });
            row._originalIndex = index.toString();
            return row;
          });

          resolve({ headers, data });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
      reader.readAsText(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    
    try {
      const { headers, data } = await parseCSV(file);
      setCsvHeaders(headers);
      setCsvData(data);
      setCurrentStep('mapping');
      
      // Auto-detect common column mappings
      const autoMapping: ColumnMapping = {};
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('nome') || lowerHeader.includes('name')) {
          autoMapping[header] = 'name';
        } else if (lowerHeader.includes('telefone') || lowerHeader.includes('phone') || lowerHeader.includes('celular')) {
          autoMapping[header] = 'phone';
        } else if (lowerHeader.includes('email') || lowerHeader.includes('e-mail')) {
          autoMapping[header] = 'email';
        }
      });
      setColumnMapping(autoMapping);
      
    } catch (error: any) {
      toast({
        title: "Erro ao processar arquivo",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const validateData = () => {
    const results = csvData.map((row, index) => {
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Validate required fields
      const name = row[Object.keys(columnMapping).find(k => columnMapping[k] === 'name') || ''];
      const phone = row[Object.keys(columnMapping).find(k => columnMapping[k] === 'phone') || ''];
      
      if (!name || name.trim() === '') {
        errors.push('Nome é obrigatório');
      }
      
      if (!phone || phone.trim() === '') {
        errors.push('Telefone é obrigatório');
      } else {
        // Basic phone validation
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        if (!/^\+?[0-9]{9,15}$/.test(cleanPhone)) {
          warnings.push('Formato de telefone pode estar incorreto');
        }
      }
      
      // Email validation
      const email = row[Object.keys(columnMapping).find(k => columnMapping[k] === 'email') || ''];
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        warnings.push('Formato de email inválido');
      }
      
      return {
        index,
        row,
        errors,
        warnings,
        isValid: errors.length === 0
      };
    });
    
    setValidationResults(results);
    setCurrentStep('validation');
  };

  const handleImport = () => {
    const validContacts = validationResults
      .filter(result => result.isValid)
      .map(result => {
        const contact: any = {};
        
        Object.entries(columnMapping).forEach(([csvColumn, fieldName]) => {
          const value = result.row[csvColumn];
          if (value && value.trim()) {
            if (fieldName === 'tags') {
              contact[fieldName] = value.split(',').map(tag => tag.trim()).filter(Boolean);
            } else {
              contact[fieldName] = value.trim();
            }
          }
        });
        
        return contact;
      });
    
    onImport(validContacts);
    onClose();
    resetState();
  };

  const resetState = () => {
    setSelectedFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setColumnMapping({});
    setValidationResults([]);
    setCurrentStep('upload');
  };

  const downloadTemplate = () => {
    const template = "nome,telefone,email,empresa,tags,notas\nJoão Silva,+244912345678,joao@email.com,Empresa XYZ,\"cliente,vip\",Cliente importante";
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_contatos.csv';
    link.click();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Button variant="outline" onClick={downloadTemplate} className="mb-4">
                <Download className="h-4 w-4 mr-2" />
                Baixar Template CSV
              </Button>
              <p className="text-sm text-muted-foreground mb-4">
                Use o template acima ou faça upload do seu próprio arquivo CSV
              </p>
            </div>
            
            <FileUpload
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              accept=".csv,.xlsx,.xls"
              maxSize={10}
            >
              Enviar arquivo CSV ou Excel
            </FileUpload>
            
            {isProcessing && (
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Processando arquivo...</p>
              </div>
            )}
          </div>
        );

      case 'mapping':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Mapear Colunas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Associe as colunas do seu arquivo aos campos do sistema
              </p>
            </div>
            
            <div className="grid gap-4">
              {Object.entries(requiredFields).map(([field, label]) => (
                <div key={field} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <Label className="font-medium">{label}</Label>
                    <p className="text-sm text-muted-foreground">Campo obrigatório</p>
                  </div>
                  <Select
                    value={Object.keys(columnMapping).find(k => columnMapping[k] === field) || ""}
                    onValueChange={(csvColumn) => {
                      const newMapping = { ...columnMapping };
                      // Remove existing mapping for this field
                      Object.keys(newMapping).forEach(key => {
                        if (newMapping[key] === field) delete newMapping[key];
                      });
                      // Add new mapping
                      if (csvColumn) newMapping[csvColumn] = field;
                      setColumnMapping(newMapping);
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Selecione coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {csvHeaders.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              
              {Object.entries(optionalFields).map(([field, label]) => (
                <div key={field} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div>
                    <Label className="font-medium">{label}</Label>
                    <p className="text-sm text-muted-foreground">Campo opcional</p>
                  </div>
                  <Select
                    value={Object.keys(columnMapping).find(k => columnMapping[k] === field) || ""}
                    onValueChange={(csvColumn) => {
                      const newMapping = { ...columnMapping };
                      Object.keys(newMapping).forEach(key => {
                        if (newMapping[key] === field) delete newMapping[key];
                      });
                      if (csvColumn) newMapping[csvColumn] = field;
                      setColumnMapping(newMapping);
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Selecione coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Não mapear</SelectItem>
                      {csvHeaders.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end">
              <Button onClick={validateData}>
                Validar Dados
              </Button>
            </div>
          </div>
        );

      case 'validation':
        const validCount = validationResults.filter(r => r.isValid).length;
        const errorCount = validationResults.filter(r => r.errors.length > 0).length;
        const warningCount = validationResults.filter(r => r.warnings.length > 0 && r.errors.length === 0).length;
        
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Resultados da Validação</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{validCount}</div>
                    <div className="text-sm text-muted-foreground">Válidos</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                    <div className="text-sm text-muted-foreground">Avisos</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                    <div className="text-sm text-muted-foreground">Erros</div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Linha</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationResults.slice(0, 10).map((result) => (
                    <TableRow key={result.index}>
                      <TableCell>{result.index + 1}</TableCell>
                      <TableCell>{result.row[Object.keys(columnMapping).find(k => columnMapping[k] === 'name') || '']}</TableCell>
                      <TableCell>{result.row[Object.keys(columnMapping).find(k => columnMapping[k] === 'phone') || '']}</TableCell>
                      <TableCell>
                        {result.errors.length > 0 ? (
                          <Badge variant="destructive">Erro</Badge>
                        ) : result.warnings.length > 0 ? (
                          <Badge variant="secondary">Aviso</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">Válido</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {validationResults.length > 10 && (
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Mostrando primeiros 10 de {validationResults.length} registros
                </p>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCurrentStep('mapping')}>
                Voltar ao Mapeamento
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                <Upload className="h-4 w-4 mr-2" />
                Importar {validCount} Contatos
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Importar Contatos via CSV</span>
          </DialogTitle>
          <DialogDescription>
            Importe seus contatos em massa através de arquivo CSV ou Excel
          </DialogDescription>
        </DialogHeader>
        
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}