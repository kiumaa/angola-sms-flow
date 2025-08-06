import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Zap, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import CountryCodeSelector from "@/components/admin/CountryCodeSelector";
import { validateAngolanPhone, normalizeAngolanPhone, sanitizeInput } from '@/lib/validation';
const QuickSend = () => {
  const [formData, setFormData] = useState({
    senderId: "SMSAO",
    countryCode: "+244",
    phoneNumber: "",
    message: ""
  });
  const [senderIds, setSenderIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messageLength, setMessageLength] = useState(0);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const maxLength = 160;
  const smsCount = Math.ceil(messageLength / maxLength);
  useEffect(() => {
    fetchSenderIds();
  }, [user?.id]);
  const fetchSenderIds = async () => {
    if (!user?.id) return;
    try {
      const {
        data,
        error
      } = await supabase.from('sender_ids').select('*').eq('user_id', user.id).eq('status', 'approved').order('is_default', {
        ascending: false
      });
      if (error) throw error;
      setSenderIds(data || []);

      // Set default sender ID if exists, otherwise use SMSAO
      const defaultSender = data?.find(s => s.is_default);
      if (defaultSender) {
        setFormData(prev => ({
          ...prev,
          senderId: defaultSender.sender_id
        }));
      } else if (data && data.length === 0) {
        // Se não há sender IDs aprovados, use SMSAO como padrão
        setFormData(prev => ({
          ...prev,
          senderId: 'SMSAO'
        }));
      }
    } catch (error) {
      console.error('Error fetching sender IDs:', error);
    }
  };
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (field === 'message') {
      setMessageLength(value.length);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!formData.senderId) {
      toast({
        title: "Sender ID obrigatório",
        description: "Selecione um Sender ID para enviar.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    
    if (!formData.phoneNumber.trim()) {
      toast({
        title: "Número obrigatório",
        description: "Insira um número de telefone válido.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Build full phone number and validate
    const fullPhoneNumber = formData.countryCode + formData.phoneNumber;
    if (!validateAngolanPhone(fullPhoneNumber)) {
      toast({
        title: "Número inválido",
        description: "Insira um número angolano válido (ex: 912345678).",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    if (!formData.message.trim()) {
      toast({
        title: "Mensagem obrigatória",
        description: "Escreva a mensagem a ser enviada.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }
    try {
      // Send SMS using Supabase edge function
      const normalizedPhoneNumber = normalizeAngolanPhone(fullPhoneNumber);
      
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phoneNumber: normalizedPhoneNumber,
          message: sanitizeInput(formData.message),
          senderId: formData.senderId,
          isTest: false
        }
      });

      if (error) throw error;
      if (data.success) {
        toast({
          title: "SMS enviado com sucesso!",
          description: `Mensagem enviada para ${normalizedPhoneNumber}`
        });

        // Reset form
        setFormData(prev => ({
          ...prev,
          phoneNumber: "",
          message: ""
        }));
        setMessageLength(0);
      } else {
        throw new Error(data.error || 'Falha no envio');
      }
    } catch (error: any) {
      console.error('SMS send error:', error);
      toast({
        title: "Erro ao enviar SMS",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <DashboardLayout>
      <div className="space-y-8 w-full">
        {/* Header */}
        <div className="glass-card p-6 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="flex items-center gap-4 relative">
            <Button variant="outline" onClick={() => navigate("/dashboard")} className="glass-card border-glass-border hover:scale-105 transition-all duration-300">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-light gradient-text">Envio Rápido</h1>
              <p className="text-muted-foreground">
                Envie SMS rapidamente para um número específico
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="card-futuristic">
              
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Sender ID Selection */}
                  <div className="space-y-2">
                    <Label className="text-base">Sender ID</Label>
                    <Select onValueChange={value => handleInputChange('senderId', value)} value={formData.senderId}>
                      <SelectTrigger className="h-12 rounded-2xl glass-card border-glass-border">
                        <SelectValue placeholder="Selecione um Sender ID" />
                      </SelectTrigger>
                       <SelectContent>
                         {/* Always show SMSAO as default option */}
                          <SelectItem value="SMSAO">
                            <div className="flex items-center gap-2">
                              SMSAO
                              <Badge variant="secondary" className="text-xs">Padrão</Badge>
                            </div>
                          </SelectItem>
                          {/* Mostrar Sender IDs aprovados, excluindo SMSAO para evitar duplicação */}
                          {senderIds
                            .filter((sender: any) => sender.sender_id !== 'SMSAO') // Filtrar SMSAO para evitar duplicação
                            .map((sender: any) => (
                            <SelectItem key={sender.id} value={sender.sender_id}>
                              <div className="flex items-center gap-2">
                                {sender.sender_id}
                                {sender.is_default && <Badge variant="secondary" className="text-xs">Padrão</Badge>}
                              </div>
                            </SelectItem>
                          ))}
                       </SelectContent>
                    </Select>
                     <p className="text-sm text-muted-foreground">
                         SMSAO está sempre disponível como Sender ID padrão. Para usar um Sender ID personalizado, <a href="/sender-ids" className="text-primary hover:underline">solicite aprovação aqui</a>.
                       </p>
                  </div>

                   {/* Phone Number */}
                   <div className="space-y-4">
                     <Label htmlFor="phoneNumber" className="text-base">Número do Destinatário</Label>
                     
                     <div className="space-y-2">
                       <Label className="text-sm text-muted-foreground">Código do País</Label>
                       <CountryCodeSelector
                         value={formData.countryCode}
                         onValueChange={(value) => handleInputChange('countryCode', value)}
                         isAdmin={false}
                         placeholder="Selecionar país"
                       />
                     </div>

                     <div className="space-y-2">
                       <Label className="text-sm text-muted-foreground">Número</Label>
                       <div className="flex items-center gap-2">
                         <span className="px-3 py-2 bg-muted rounded-md text-sm font-medium h-12 flex items-center">
                           {formData.countryCode}
                         </span>
                         <Input 
                           id="phoneNumber" 
                           placeholder="912 345 678" 
                           value={formData.phoneNumber} 
                           onChange={e => handleInputChange('phoneNumber', e.target.value)} 
                           className="h-12 rounded-2xl glass-card border-glass-border bg-slate-50 flex-1" 
                         />
                       </div>
                     </div>
                     
                     <div className="text-sm text-muted-foreground">
                       Digite apenas o número sem o código do país
                     </div>
                   </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-base">Mensagem</Label>
                    <Textarea id="message" placeholder="Digite sua mensagem aqui..." value={formData.message} onChange={e => handleInputChange('message', e.target.value)} maxLength={160} className="min-h-32 rounded-2xl glass-card border-glass-border resize-none bg-slate-50" />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Mensagem direta
                      </span>
                      <span className={`${messageLength > maxLength ? 'text-orange-500' : 'text-muted-foreground'}`}>
                        {messageLength}/160 caracteres • {smsCount} SMS
                      </span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" disabled={isLoading} className="w-full button-futuristic py-6 text-sm font-normal">
                    {isLoading ? "Enviando..." : <>
                      <Send className="h-5 w-5 mr-2" />
                      Enviar SMS
                    </>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Preview & Summary */}
          <div className="space-y-6">
            {/* Message Preview */}
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle className="gradient-text">Preview da Mensagem</CardTitle>
                <CardDescription>Como sua mensagem aparecerá no celular</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl p-4 border-l-4 border-primary bg-gray-200">
                   <div className="text-xs text-muted-foreground mb-1">De: {formData.senderId || "SMSAO"}</div>
                   <div className="text-xs text-muted-foreground mb-2">Para: {formData.phoneNumber ? formData.countryCode + formData.phoneNumber : "+244 XXX XXX XXX"}</div>
                  <div className="font-mono text-sm">
                    {formData.message || "Digite sua mensagem para ver o preview..."}
                  </div>
                  {messageLength > 0 && <div className="mt-3 flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {smsCount} SMS • {messageLength} caracteres
                      </span>
                      <Badge variant={smsCount > 1 ? "destructive" : "default"}>
                        {smsCount > 1 ? `${smsCount}x créditos` : "1 crédito"}
                      </Badge>
                    </div>}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="card-futuristic border-blue-500/30 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="text-lg text-gray-950">Dicas de Envio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Use números no formato angolano (+244)</p>
                <p>• Mensagens até 160 caracteres usam 1 crédito</p>
                <p>• Seja claro e direto na mensagem</p>
                <p>• Verifique o número antes de enviar</p>
                <p>• Use Sender IDs aprovados apenas</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>;
};
export default QuickSend;