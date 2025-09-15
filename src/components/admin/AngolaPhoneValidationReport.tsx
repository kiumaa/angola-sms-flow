import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info, Download } from 'lucide-react';
import { AngolaPhoneValidator } from '@/lib/validation/angolaValidation';

export function AngolaPhoneValidationReport() {
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateNumbers = () => {
    setIsValidating(true);
    
    setTimeout(() => {
      const numbers = phoneNumbers
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      const result = AngolaPhoneValidator.validateBatch(numbers);
      setValidationResult(result);
      setIsValidating(false);
    }, 500);
  };

  const exportResults = () => {
    if (!validationResult) return;
    
    const csvContent = [
      'Número,Status,Formato E164,Operadora',
      ...validationResult.valid.map((phone: string) => {
        const e164 = AngolaPhoneValidator.normalizeToE164(phone);
        const operator = AngolaPhoneValidator.getOperator(phone);
        return `${phone},Válido,${e164},${operator}`;
      }),
      ...validationResult.invalid.map((phone: string) => `${phone},Inválido,,`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'validacao-telefones-angola.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Validação de Números Angolanos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              Números de Telefone (um por linha)
            </label>
            <Textarea
              value={phoneNumbers}
              onChange={(e) => setPhoneNumbers(e.target.value)}
              placeholder={`+244923456789
923456789
244921123456
+244920987654`}
              rows={8}
              className="mt-2"
            />
          </div>
          
          <Button 
            onClick={validateNumbers}
            disabled={!phoneNumbers.trim() || isValidating}
            className="w-full"
          >
            {isValidating ? 'Validando...' : 'Validar Números'}
          </Button>
        </CardContent>
      </Card>

      {validationResult && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Validação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {validationResult.summary.total}
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {validationResult.summary.validCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Válidos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {validationResult.summary.invalidCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Inválidos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round((validationResult.summary.validCount / validationResult.summary.total) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {Object.keys(validationResult.summary.operators).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Operadora</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(validationResult.summary.operators).map(([operator, count]: [string, any]) => (
                    <div key={operator} className="flex justify-between items-center">
                      <span className="font-medium">{operator}</span>
                      <Badge variant="secondary">{count} números</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Números Válidos ({validationResult.valid.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {validationResult.valid.map((phone: string, index: number) => {
                    const e164 = AngolaPhoneValidator.normalizeToE164(phone);
                    const operator = AngolaPhoneValidator.getOperator(phone);
                    const formatted = AngolaPhoneValidator.formatForDisplay(phone);
                    
                    return (
                      <div key={index} className="p-2 bg-green-50 rounded border-l-4 border-green-400">
                        <div className="font-medium">{formatted}</div>
                        <div className="text-sm text-muted-foreground">
                          E164: {e164} | Operadora: {operator}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span>Números Inválidos ({validationResult.invalid.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {validationResult.invalid.map((phone: string, index: number) => (
                    <div key={index} className="p-2 bg-red-50 rounded border-l-4 border-red-400">
                      <div className="font-medium">{phone}</div>
                      <div className="text-sm text-red-600">
                        Formato inválido para número angolano
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <Button onClick={exportResults} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar Resultados (CSV)
            </Button>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Formatos aceitos para Angola:</strong><br />
              • Formato internacional: +244923456789<br />
              • Formato internacional sem +: 244923456789<br />
              • Formato nacional: 923456789<br />
              <br />
              <strong>Operadoras suportadas:</strong> Unitel, Movicel, Africell
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}