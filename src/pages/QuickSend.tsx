import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Users, 
  MessageSquare, 
  CreditCard, 
  Clock,
  Globe,
  Sparkles,
  TrendingUp,
  History,
  ArrowLeft
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useContacts } from "@/hooks/useContacts";
import { useSenderIds } from "@/hooks/useSenderIds";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { InternationalPhoneInput } from "@/components/shared/InternationalPhoneInput";
import { BulkPhoneInput } from "@/components/shared/BulkPhoneInput";
import { ContactSelector } from "@/components/shared/ContactSelector";
import { MessagePreview } from "@/components/shared/MessagePreview";
import { CreditEstimator } from "@/components/shared/CreditEstimator";
import { 
  normalizeInternationalPhone,
  validateAndNormalizeInternationalPhones, 
  parseBulkInternationalPhoneInput,
  DEFAULT_COUNTRY,
  type PhoneCountry 
} from "@/lib/internationalPhoneNormalization";
import { calculateSMSSegments } from "@/lib/smsUtils";

interface Contact {
  id: string;
  name: string;
  phone: string;
  phone_e164: string | null;
  email: string | null;
  tags: string[] | null;
  is_blocked: boolean;
}

const QuickSendNew = () => {
  // State management
  const [senderId, setSenderId] = useState("SMSAO");
  const [recipientMode, setRecipientMode] = useState<"single" | "bulk" | "contacts">("single");
  const [singleNumber, setSingleNumber] = useState("");
  const [bulkNumbers, setBulkNumbers] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<PhoneCountry>(DEFAULT_COUNTRY);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bulkValidation, setBulkValidation] = useState<any>(null);

  // Hooks
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { credits = 0, loading: creditsLoading, refetch: refetchCredits } = useUserCredits();
  const { contacts = [], loading: contactsLoading } = useContacts();
  const { senderIds = [], loading: senderIdsLoading } = useSenderIds();

  // Compute all normalized numbers
  const allNormalizedNumbers = useMemo(() => {
    const numbers: string[] = [];
    
    switch (recipientMode) {
      case "single":
        if (singleNumber) {
          const result = normalizeInternationalPhone(singleNumber, selectedCountry);
          if (result.ok && result.e164) {
            numbers.push(result.e164);
          }
        }
        break;
        
      case "bulk":
        if (bulkValidation?.valid) {
          numbers.push(...bulkValidation.valid);
        }
        break;
        
      case "contacts":
        selectedContacts.forEach(contact => {
          if (contact.phone_e164) {
            numbers.push(contact.phone_e164);
          } else if (contact.phone) {
            const result = normalizeInternationalPhone(contact.phone, selectedCountry);
            if (result.ok && result.e164) {
              numbers.push(result.e164);
            }
          }
        });
        break;
    }
    
    // Deduplicate
    return Array.from(new Set(numbers));
  }, [recipientMode, singleNumber, selectedCountry, bulkValidation, selectedContacts]);

  // Calculate SMS segments and costs
  const segmentInfo = useMemo(() => calculateSMSSegments(message), [message]);
  const totalCreditsNeeded = segmentInfo.segments * allNormalizedNumbers.length;
  const canSend = allNormalizedNumbers.length > 0 && message.trim() && totalCreditsNeeded <= credits && !isLoading;

  // Get available sender IDs
  const availableSenderIds = useMemo(() => {
    return senderIds
      .filter(s => s.status === 'approved')
      .map(s => ({
        value: s.sender_id,
        label: s.display_name || s.sender_id,
        isDefault: s.is_default
      }));
  }, [senderIds]);

  // Handle sending
  const handleSend = async () => {
    if (!canSend) return;

    try {
      setIsLoading(true);

      const response = await supabase.functions.invoke('send-quick-sms', {
        body: {
          sender_id: senderId,
          recipients: allNormalizedNumbers,
          message: message.trim(),
          user_id: user?.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao enviar SMS');
      }

      toast({
        title: "SMS enviado com sucesso!",
        description: `${allNormalizedNumbers.length} mensagens foram enviadas.`,
      });

      // Reset form
      setSingleNumber("");
      setBulkNumbers("");
      setSelectedContacts([]);
      setMessage("");
      
      // Refresh credits
      await refetchCredits();

      // Navigate to reports
      navigate("/reports");

    } catch (error: any) {
      console.error('Erro ao enviar SMS:', error);
      toast({
        title: "Erro ao enviar SMS",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (creditsLoading || contactsLoading || senderIdsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Envio Rápido</h1>
            <p className="text-muted-foreground">
              Envie SMS para um ou múltiplos destinatários
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Globe className="h-3 w-3" />
              Suporte Internacional
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Melhorado
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form - Left side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sender ID Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Remetente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={senderId} onValueChange={setSenderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar remetente" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSenderIds.map((sender) => (
                      <SelectItem key={sender.value} value={sender.value}>
                        <div className="flex items-center gap-2">
                          <span>{sender.label}</span>
                          {sender.isDefault && (
                            <Badge variant="secondary" className="text-xs">Padrão</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Recipients Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Destinatários
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={recipientMode} onValueChange={(value) => setRecipientMode(value as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="single">Número único</TabsTrigger>
                    <TabsTrigger value="bulk">Lista de números</TabsTrigger>
                    <TabsTrigger value="contacts">Contatos</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="single" className="space-y-4 mt-4">
                    <InternationalPhoneInput
                      value={singleNumber}
                      onChange={setSingleNumber}
                      country={selectedCountry}
                      onCountryChange={setSelectedCountry}
                      placeholder="Digite o número de telefone"
                    />
                  </TabsContent>
                  
                  <TabsContent value="bulk" className="space-y-4 mt-4">
                    <BulkPhoneInput
                      value={bulkNumbers}
                      onChange={setBulkNumbers}
                      onValidationChange={setBulkValidation}
                      defaultCountry={selectedCountry}
                      onCountryChange={setSelectedCountry}
                    />
                  </TabsContent>
                  
                  <TabsContent value="contacts" className="space-y-4 mt-4">
                    <ContactSelector
                      contacts={contacts}
                      selectedContacts={selectedContacts}
                      onSelectionChange={setSelectedContacts}
                    />
                    {selectedContacts.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {selectedContacts.length} contatos selecionados
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                
                {/* Recipients summary */}
                {allNormalizedNumbers.length > 0 && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span>Total de destinatários válidos:</span>
                      <Badge variant="default">{allNormalizedNumbers.length}</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message Composition */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Mensagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="min-h-32 resize-y"
                  maxLength={1000}
                />
                
                {/* Message stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{message.length}/1000 caracteres</span>
                  <div className="flex items-center gap-4">
                    <span>Codificação: {segmentInfo.encoding}</span>
                    <span>Segmentos: {segmentInfo.segments}</span>
                  </div>
                </div>
                
                {segmentInfo.segments > 1 && (
                  <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950 p-3 rounded border border-amber-200 dark:border-amber-800">
                    ⚠ Mensagem será enviada em {segmentInfo.segments} partes
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Send Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={handleSend}
                  disabled={!canSend}
                  className="w-full h-12 text-lg gap-2"
                  size="lg"
                >
                  {isLoading ? (
                    <LoadingSpinner className="w-5 h-5" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  {isLoading ? "Enviando..." : `Enviar SMS (${totalCreditsNeeded} créditos)`}
                </Button>
                
                {!canSend && allNormalizedNumbers.length > 0 && message.trim() && (
                  <div className="mt-3 text-sm text-destructive text-center">
                    {totalCreditsNeeded > credits 
                      ? `Créditos insuficientes. Necessário: ${totalCreditsNeeded}, disponível: ${credits}`
                      : "Verifique os dados antes de enviar"
                    }
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right side */}
          <div className="space-y-6">
            {/* Message Preview */}
            <MessagePreview
              message={message}
              senderName={senderId}
            />

            {/* Credit Estimator */}
            <CreditEstimator
              message={message}
              recipientCount={allNormalizedNumbers.length}
              userCredits={credits}
            />

            {/* Quick Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dicas rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Suporte para múltiplos países: Angola, Brasil, Portugal, Moçambique e mais</span>
                </div>
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Mensagens com caracteres especiais são enviadas em Unicode (maior custo)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CreditCard className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>1 crédito = 1 segmento SMS (máx. 160 caracteres GSM)</span>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Envios são processados imediatamente</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <History className="h-4 w-4" />
                  Uso recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Créditos disponíveis:</span>
                    <Badge variant="outline" className="font-mono">
                      {credits.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Contatos ativos:</span>
                    <Badge variant="outline">
                      {contacts.filter(c => !c.is_blocked).length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sender IDs aprovados:</span>
                    <Badge variant="outline">
                      {availableSenderIds.length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickSendNew;