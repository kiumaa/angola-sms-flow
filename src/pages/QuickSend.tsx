import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Send, Users, Plus, Trash2, AlertTriangle, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useContacts } from "@/hooks/useContacts";
import { useSenderIds } from "@/hooks/useSenderIds";
import { supabase } from "@/integrations/supabase/client";
import { validateAndNormalizePhones, parseBulkPhoneInput } from "@/lib/phoneNormalization";
import { calculateSMSSegments } from "@/lib/smsUtils";
import { resolveSenderId } from "@/lib/senderIdUtils";

const QuickSend = () => {
  const [senderId, setSenderId] = useState("SMSAO");
  const [singleNumber, setSingleNumber] = useState("");
  const [bulkNumbers, setBulkNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contactsModalOpen, setContactsModalOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchContacts, setSearchContacts] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { credits, loading: creditsLoading } = useUserCredits();
  const { contacts, loading: contactsLoading } = useContacts();
  const { senderIds, loading: senderIdsLoading } = useSenderIds();

  // Normalize all phone numbers
  const normalizedNumbers = useMemo(() => {
    const numbers: string[] = [];
    
    // Add single number if provided
    if (singleNumber.trim()) {
      numbers.push(singleNumber.trim());
    }
    
    // Add bulk numbers
    const bulkLines = parseBulkPhoneInput(bulkNumbers);
    numbers.push(...bulkLines);
    
    // Add selected contacts
    const contactNumbers = selectedContacts
      .map(contactId => contacts.find(c => c.id === contactId)?.phone_e164)
      .filter(Boolean) as string[];
    
    numbers.push(...contactNumbers);
    
    // Validate and normalize all numbers
    const validation = validateAndNormalizePhones(numbers);
    
    return {
      valid: validation.valid,
      invalid: validation.invalid.map(item => item.phone),
      total: numbers.length,
      duplicates: validation.duplicates
    };
  }, [singleNumber, bulkNumbers, selectedContacts, contacts]);

  // Calculate SMS segments and costs
  const segmentInfo = useMemo(() => {
    return calculateSMSSegments(message);
  }, [message]);

  const totalSms = segmentInfo.segments * normalizedNumbers.valid.length;
  const canSend = message.trim().length > 0 && normalizedNumbers.valid.length > 0 && totalSms <= credits;

  // Filter contacts for modal
  const filteredContacts = useMemo(() => {
    if (!searchContacts) return contacts;
    return contacts.filter(contact =>
      contact.name?.toLowerCase().includes(searchContacts.toLowerCase()) ||
      contact.phone_e164?.includes(searchContacts)
    );
  }, [contacts, searchContacts]);

  const handleRemoveInvalidNumber = (number: string) => {
    const newBulk = bulkNumbers
      .split(/[\n,;]+/)
      .filter(n => n.trim() !== number)
      .join('\n');
    setBulkNumbers(newBulk);
    
    if (singleNumber === number) {
      setSingleNumber('');
    }
  };

  const handleContactSelection = (contactId: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, contactId]);
    } else {
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-quick-sms', {
        body: {
          sender_id: resolveSenderId(senderId),
          recipients: normalizedNumbers.valid,
          message: message.trim(),
          estimate: {
            segments: segmentInfo.segments,
            credits: totalSms
          }
        }
      });

      if (error) throw error;

      if (data?.success) {
        const actualSent = data.sent || 0;
        const actualCredits = data.credits_debited || 0;
        
        toast({
          title: "SMS enviado com sucesso!",
          description: `${actualSent} de ${normalizedNumbers.valid.length} mensagem(s) enviada(s) • ${actualCredits} crédito(s) debitado(s)`
        });

        // Reset form
        setSingleNumber('');
        setBulkNumbers('');
        setMessage('');
        setSelectedContacts([]);
        
        // Refetch credits to show updated balance
        setTimeout(() => {
          // Allow a moment for the database to update
          window.location.reload();
        }, 1000);
      } else {
        // Handle standardized error responses
        const errorCode = data?.error || 'UNKNOWN_ERROR';
        let friendlyMessage = 'Erro desconhecido ao enviar SMS';
        
        switch (errorCode) {
          case 'INSUFFICIENT_CREDITS':
            friendlyMessage = `Créditos insuficientes. Necessários: ${data?.required || 0}, Disponíveis: ${data?.available || 0}`;
            break;
          case 'INVALID_NUMBERS':
            friendlyMessage = 'Nenhum número válido encontrado';
            break;
          case 'RATE_LIMIT_EXCEEDED':
            friendlyMessage = 'Muitas tentativas. Aguarde alguns segundos e tente novamente';
            break;
          case 'BULKSMS_FAILURE':
            friendlyMessage = 'Falha na operadora SMS. Tente novamente em instantes';
            break;
          default:
            friendlyMessage = data?.message || 'Erro ao processar solicitação';
        }
        
        throw new Error(friendlyMessage);
      }
    } catch (error: any) {
      console.error('SMS send error:', error);
      
      let errorMessage = error.message || "Erro interno. Tente novamente mais tarde.";
      
      // Handle network errors
      if (error.name === 'FunctionsError' || error.message?.includes('fetch')) {
        errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
      }
      
      toast({
        title: "Erro ao enviar SMS",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Available sender IDs with SMSAO as default
  const availableSenderIds = useMemo(() => {
    const ids = [{ id: 'smsao', sender_id: 'SMSAO', is_global: true }];
    if (senderIds) {
      ids.push(...senderIds.filter(s => s.sender_id !== 'SMSAO').map(s => ({ 
        ...s, 
        is_global: false 
      })));
    }
    return ids;
  }, [senderIds]);

  return (
    <DashboardLayout>
      <div className="space-y-8 w-full">
        {/* Header */}
        <div className="glass-card p-6 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="flex items-center gap-4 relative">
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard")} 
              className="glass-card border-glass-border hover:scale-105 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-light gradient-text">Envio Rápido</h1>
              <p className="text-muted-foreground">
                Envie SMS para um ou vários destinatários
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sender ID */}
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle>Sender ID</CardTitle>
                <CardDescription>Remetente que aparecerá no SMS</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={senderId} onValueChange={setSenderId}>
                  <SelectTrigger className="h-12 rounded-2xl glass-card border-glass-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSenderIds.map((sender: any) => (
                      <SelectItem key={sender.id} value={sender.sender_id}>
                        <div className="flex items-center gap-2">
                          {sender.sender_id}
                          {(sender.sender_id === 'SMSAO' || sender.is_global) && 
                            <Badge variant="secondary" className="text-xs">Padrão</Badge>
                          }
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  SMSAO é o remetente padrão do sistema. Para usar um remetente personalizado, solicite aprovação em{' '}
                  <button 
                    onClick={() => navigate('/sender-ids')} 
                    className="text-primary hover:underline"
                  >
                    Sender IDs
                  </button>.
                </p>
              </CardContent>
            </Card>

            {/* Recipients */}
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Destinatários
                  <Dialog open={contactsModalOpen} onOpenChange={setContactsModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Adicionar dos Contatos
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Selecionar Contatos</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                        <Input
                          placeholder="Buscar contatos..."
                          value={searchContacts}
                          onChange={(e) => setSearchContacts(e.target.value)}
                          className="rounded-xl"
                        />
                        <div className="flex-1 overflow-y-auto space-y-2">
                          {contactsLoading ? (
                            <p className="text-muted-foreground">Carregando contatos...</p>
                          ) : filteredContacts.length === 0 ? (
                            <p className="text-muted-foreground">Nenhum contato encontrado.</p>
                          ) : (
                            filteredContacts.map((contact) => (
                              <div key={contact.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded-lg">
                                <Checkbox
                                  checked={selectedContacts.includes(contact.id)}
                                  onCheckedChange={(checked) => 
                                    handleContactSelection(contact.id, checked as boolean)
                                  }
                                />
                                <div className="flex-1">
                                  <p className="font-medium">{contact.name}</p>
                                  <p className="text-sm text-muted-foreground">{contact.phone_e164}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t">
                          <p className="text-sm text-muted-foreground">
                            {selectedContacts.length} contato(s) selecionado(s)
                          </p>
                          <Button onClick={() => setContactsModalOpen(false)}>
                            Adicionar Selecionados
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
                <CardDescription>Adicione números individualmente ou em lote</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Single Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Número único</Label>
                  <div className="flex gap-2">
                    <span className="flex items-center px-3 py-2 bg-muted rounded-lg text-sm font-medium">
                      +244
                    </span>
                    <Input
                      placeholder="912 345 678"
                      value={singleNumber}
                      onChange={(e) => setSingleNumber(e.target.value)}
                      className="rounded-xl glass-card border-glass-border bg-slate-50"
                    />
                  </div>
                </div>

                {/* Bulk Numbers */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Colar lista</Label>
                  <Textarea
                    placeholder={`9XXXXXXXX\n9XXXXXXXX,9XXXXXXXX\n9XXXXXXXX;9XXXXXXXX`}
                    value={bulkNumbers}
                    onChange={(e) => setBulkNumbers(e.target.value)}
                    className="min-h-24 rounded-xl glass-card border-glass-border resize-none bg-slate-50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separe números por linha, vírgula ou ponto-e-vírgula
                  </p>
                </div>

                {/* Selected Contacts Display */}
                {selectedContacts.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Contatos selecionados</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedContacts.map(contactId => {
                        const contact = contacts.find(c => c.id === contactId);
                        return contact ? (
                          <Badge key={contactId} variant="secondary" className="flex items-center gap-1">
                            {contact.name}
                            <button
                              onClick={() => setSelectedContacts(prev => prev.filter(id => id !== contactId))}
                              className="text-xs hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Numbers Summary */}
                <div className="flex items-center gap-4 text-sm bg-muted/50 rounded-lg p-3">
                  <span className="text-green-600 font-medium">
                    Válidos: {normalizedNumbers.valid.length}
                  </span>
                  {normalizedNumbers.invalid.length > 0 && (
                    <span className="text-red-600 font-medium">
                      Inválidos: {normalizedNumbers.invalid.length}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    Total: {normalizedNumbers.total}
                  </span>
                </div>

                {/* Invalid Numbers */}
                {normalizedNumbers.invalid.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-red-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Números inválidos
                    </Label>
                    <div className="space-y-1">
                      {normalizedNumbers.invalid.map((number, index) => (
                        <div key={index} className="flex items-center justify-between bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">
                          <span className="text-sm font-mono">{number}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveInvalidNumber(number)}
                            className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message */}
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle>Mensagem</CardTitle>
                <CardDescription>Digite o conteúdo do SMS</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Digite sua mensagem aqui..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-32 rounded-xl glass-card border-glass-border resize-none bg-slate-50"
                />
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      {segmentInfo.encoding} • {message.length} caracteres
                    </span>
                    {segmentInfo.encoding === 'UCS2' && (
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        Unicode detectado
                      </Badge>
                    )}
                  </div>
                  <span className="font-medium">
                    {segmentInfo.segments} segmento(s) • {totalSms} SMS total
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Send Button */}
            <div className="sticky bottom-4 bg-background/95 backdrop-blur-sm border rounded-2xl p-4">
              <Button
                onClick={handleSend}
                disabled={!canSend || isLoading}
                className="w-full button-futuristic py-6 text-base font-medium"
                size="lg"
              >
                {isLoading ? (
                  "Enviando..."
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Enviar {normalizedNumbers.valid.length} SMS • {totalSms} crédito(s)
                  </>
                )}
              </Button>
              {totalSms > credits && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Créditos insuficientes. 
                  <button 
                    onClick={() => navigate('/credits')}
                    className="underline hover:no-underline font-medium"
                  >
                    Carregar mais créditos
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Preview & Summary - Right Side (Sticky) */}
          <div className="space-y-6">
            {/* Message Preview */}
            <Card className="card-futuristic sticky top-4">
              <CardHeader>
                <CardTitle className="gradient-text">Preview da Mensagem</CardTitle>
                <CardDescription>Como aparecerá no celular</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl p-4 border-l-4 border-primary bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">
                    De: {senderId}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    Para: {normalizedNumbers.valid.length === 0 
                      ? "+244 XXX XXX XXX" 
                      : normalizedNumbers.valid.length === 1 
                        ? String(normalizedNumbers.valid[0])
                        : `${normalizedNumbers.valid.length} destinatários`
                    }
                  </div>
                  <div className="font-mono text-sm whitespace-pre-wrap">
                    {message || "Digite sua mensagem para ver o preview..."}
                  </div>
                  {message.length > 0 && (
                    <div className="mt-3 flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {message.length} chars • {segmentInfo.segments} segmento(s)
                      </span>
                      <Badge variant={segmentInfo.segments > 1 ? "destructive" : "default"}>
                        {segmentInfo.segments > 1 ? `${segmentInfo.segments} créditos` : "1 crédito"}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Resumo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Destinatários válidos</p>
                    <p className="text-xl font-semibold">{normalizedNumbers.valid.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total de SMS</p>
                    <p className="text-xl font-semibold">{totalSms}</p>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-muted-foreground">Créditos disponíveis:</span>
                    <span className="font-medium">{creditsLoading ? '...' : credits}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Custo estimado:</span>
                    <span className="font-medium">{totalSms} crédito(s)</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-semibold mt-2 pt-2 border-t">
                    <span>Após envio:</span>
                    <span className={totalSms > credits ? "text-red-600" : "text-green-600"}>
                      {Math.max(0, credits - totalSms)} crédito(s)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="card-futuristic border-blue-500/30 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="text-lg">Dicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Use números no formato angolano (+244)</p>
                <p>• Evite caracteres especiais para reduzir custos</p>
                <p>• Mensagens até 160 caracteres = 1 segmento</p>
                <p>• Verifique os números antes de enviar</p>
                <p>• Unicode (emoji) aumenta o custo dos SMS</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuickSend;