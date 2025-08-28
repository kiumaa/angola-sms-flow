import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { validateAngolanPhone, normalizeAngolanPhone, validateInternationalPhone, normalizeInternationalPhone, sanitizeInput } from '@/lib/validation';
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

      // Send test SMS directly without campaign
      const { data, error } = await supabase.functions.invoke('send-quick-sms', {
        body: {
          phoneNumber: normalizeInternationalPhone(fullPhoneNumber),
          message: sanitizeInput(message),
          isTest: true
        }
      });

      if (error) throw error;

      // Update results
      setResults(prev => [{
        id: Date.now(),
        gateway: data.gateway || 'unknown',
        status: data.success ? 'success' : 'failed',
        timestamp: new Date().toISOString(),
        phone: normalizeInternationalPhone(fullPhoneNumber),
        message: sanitizeInput(message),
        error: data.error || null,
        responseTime: data.responseTime || 0
      }, ...prev]);

      toast({
        title: data.success ? "SMS enviado com sucesso!" : "Falha no envio",
        description: data.success 
          ? `Enviado via ${data.gateway} em ${data.responseTime}ms`
          : `Erro: ${data.error}`,
        variant: data.success ? "default" : "destructive",
      });

      // Clear form on success
      if (data.success) {
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
    <Card>
      <CardHeader>
        <CardTitle>Testar Gateway SMS</CardTitle>
        <CardDescription>
          Envie um SMS de teste para verificar a configuração do gateway
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
                      Response Time (ms)
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.message}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.timestamp}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.responseTime}</td>
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
  );
};

export default SMSGatewayTester;
