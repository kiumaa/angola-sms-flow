import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, TestTube, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { validateAngolanPhone, normalizeAngolanPhone, validateInternationalPhone, normalizeInternationalPhone, sanitizeInput } from '@/lib/validation';
import { Badge } from '@/components/ui/badge';
import AngolaTestPanel from './AngolaTestPanel';

// Helper function to detect country from phone number
const detectCountryFromPhone = (phoneNumber: string): string => {
  const normalized = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  if (normalized.startsWith('+244') || normalized.startsWith('244')) {
    return 'AO'; // Angola
  }
  
  if (normalized.startsWith('+351') || normalized.startsWith('351')) {
    return 'PT'; // Portugal
  }

  if (normalized.startsWith('+258') || normalized.startsWith('258')) {
    return 'MZ'; // Mozambique
  }

  if (normalized.startsWith('+238') || normalized.startsWith('238')) {
    return 'CV'; // Cape Verde
  }

  return 'UNKNOWN';
};
import CountryCodeSelector from './CountryCodeSelector';

const SMSGatewayTester = () => {
  const [countryCode, setCountryCode] = useState('+244');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        setIsAdmin(roles?.role === 'admin');
      }
    };
    checkUserRole();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build full phone number with country code
    const fullPhoneNumber = countryCode + phoneNumber;
    
    // Validate inputs - For testing, allow international numbers
    if (!validateInternationalPhone(fullPhoneNumber)) {
      toast({
        title: "Número inválido",
        description: `Por favor, insira um número válido para ${countryCode}`,
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Por favor, digite uma mensagem para enviar",
        variant: "destructive",
      });
      return;
    }

    if (message.length > 160) {
      toast({
        title: "Mensagem muito longa",
        description: "A mensagem deve ter no máximo 160 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('Usuário não autenticado');
      }

      // Send test SMS using sms-gateway-dispatcher for intelligent routing
      const { data, error } = await supabase.functions.invoke('sms-gateway-dispatcher', {
        body: {
          message: {
            to: normalizeInternationalPhone(fullPhoneNumber),
            from: 'SMSAO',
            text: sanitizeInput(message)
          },
          userId: user.data.user.id
        }
      });

      if (error) throw error;

      // Update results based on gateway dispatcher response
      const success = data.finalResult.success;
      const gatewayUsed = data.finalResult.gateway;
      const fallbackUsed = data.fallbackUsed;
      
      setResults(prev => [{
        id: Date.now(),
        gateway: `${gatewayUsed}${fallbackUsed ? ' (Fallback)' : ''}`,
        status: success ? 'success' : 'failed',
        timestamp: new Date().toISOString(),
        phone: normalizeInternationalPhone(fullPhoneNumber),
        message: sanitizeInput(message),
        error: success ? null : (data.finalResult.error || 'Unknown error'),
        responseTime: 0,
        sent: success ? 1 : 0,
        failed: success ? 0 : 1,
        credits: data.finalResult.cost || 1,
        attempts: data.attempts.length,
        routing: {
          countryDetected: detectCountryFromPhone(fullPhoneNumber),
          fallbackUsed: fallbackUsed,
          attempts: data.attempts
        }
      }, ...prev]);

      toast({
        title: success ? "SMS enviado com sucesso!" : "Falha no envio",
        description: success 
          ? `Enviado via ${gatewayUsed}. ${fallbackUsed ? 'Fallback usado. ' : ''}Créditos: ${data.finalResult.cost || 1}`
          : `Erro: ${data.finalResult.error || 'Falha na comunicação com gateway'}`,
        variant: success ? "default" : "destructive",
      });

      // Clear form on success
      if (success) {
        setPhoneNumber('');
        setMessage('');
      }

    } catch (error: any) {
      console.error('Erro no teste:', error);
      toast({
        title: "Erro no teste",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AngolaTestPanel />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Teste Geral de Gateway SMS
          </CardTitle>
          <CardDescription>
            Teste o envio de SMS para qualquer país e veja qual gateway é usado automaticamente
          </CardDescription>
        </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country">Código do País</Label>
            <CountryCodeSelector
              value={countryCode}
              onValueChange={setCountryCode}
              isAdmin={isAdmin}
              placeholder="Selecionar país"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Número de Telefone</Label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
                {countryCode}
              </span>
              <Input
                id="phone"
                type="tel"
                placeholder={countryCode === '+244' ? '9XX XXX XXX' : 'Número local'}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Input
              id="message"
              type="text"
              placeholder="Olá, este é um teste!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar SMS de Teste"}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </form>

        {results.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Resultados dos Testes</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gateway
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mensagem
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enviados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Créditos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roteamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Erro
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result) => (
                    <tr key={result.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.gateway}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{result.message}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(result.timestamp).toLocaleTimeString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.sent || 0}/{result.failed || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.credits || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.routing ? (
                          <div className="text-xs">
                            <div>País: {result.routing.countryDetected}</div>
                            <div>Tentativas: {result.attempts}</div>
                            {result.routing.fallbackUsed && <div className="text-orange-600">Fallback usado</div>}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.error || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
};

export default SMSGatewayTester;
