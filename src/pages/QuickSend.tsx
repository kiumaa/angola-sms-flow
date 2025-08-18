import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Send, 
  Users, 
  MessageSquare, 
  CreditCard, 
  Phone, 
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useUserCredits } from "@/hooks/useUserCredits";
import { useSenderIds } from "@/hooks/useSenderIds";
import { useQuickSend } from "@/hooks/useQuickSend";
import { normalizePhoneAngola } from "@/lib/phoneNormalization";
import { calculateSMSSegments } from "@/lib/smsUtils";

const QuickSend = () => {
  const { toast } = useToast();
  const { credits, refetch: refetchCredits } = useUserCredits();
  const { senderIds, getSenderIdForDropdown } = useSenderIds();
  const { sendQuickSMS, getJobStatus, loading } = useQuickSend();

  // Form state
  const [message, setMessage] = useState("");
  const [senderId, setSenderId] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [phoneInput, setPhoneInput] = useState("");
  const [bulkInput, setBulkInput] = useState("");

  // Progress modal state
  const [showProgress, setShowProgress] = useState(false);
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [jobStats, setJobStats] = useState<any>(null);

  // Calculate message stats
  const segmentInfo = calculateSMSSegments(message);
  const creditsEstimated = recipients.length * segmentInfo.segments;

  // Set default sender ID
  useEffect(() => {
    const dropdownOptions = getSenderIdForDropdown();
    const defaultOption = dropdownOptions.find(opt => opt.isDefault) || dropdownOptions[0];
    if (defaultOption && !senderId) {
      setSenderId(defaultOption.value);
    }
  }, [senderIds, senderId, getSenderIdForDropdown]);

  const addSinglePhone = () => {
    if (!phoneInput.trim()) return;

    const normalized = normalizePhoneAngola(phoneInput.trim());
    if (!normalized.ok) {
      toast({
        title: "Número Inválido",
        description: normalized.reason || "Formato de número inválido",
        variant: "destructive"
      });
      return;
    }

    if (recipients.includes(normalized.e164!)) {
      toast({
        title: "Número Duplicado",
        description: "Este número já está na lista",
        variant: "destructive"
      });
      return;
    }

    setRecipients([...recipients, normalized.e164!]);
    setPhoneInput("");
  };

  const addBulkPhones = () => {
    if (!bulkInput.trim()) return;

    const lines = bulkInput.split(/[\n,;]/).map(line => line.trim()).filter(Boolean);
    const newRecipients = [...recipients];
    const errors: string[] = [];

    lines.forEach(line => {
      const normalized = normalizePhoneAngola(line);
      if (normalized.ok && normalized.e164) {
        if (!newRecipients.includes(normalized.e164)) {
          newRecipients.push(normalized.e164);
        }
      } else {
        errors.push(`${line}: ${normalized.reason}`);
      }
    });

    setRecipients(newRecipients);
    setBulkInput("");

    if (errors.length > 0) {
      toast({
        title: "Alguns números foram ignorados",
        description: `${errors.length} números inválidos encontrados`,
        variant: "destructive"
      });
    }
  };

  const removeRecipient = (phone: string) => {
    setRecipients(recipients.filter(r => r !== phone));
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "Erro",
        description: "Mensagem é obrigatória",
        variant: "destructive"
      });
      return;
    }

    if (recipients.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um destinatário",
        variant: "destructive"
      });
      return;
    }

    if (credits < creditsEstimated) {
      toast({
        title: "Créditos Insuficientes",
        description: `Você precisa de ${creditsEstimated} créditos, mas tem apenas ${credits}`,
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await sendQuickSMS({
        message,
        recipients,
        senderId
      });

      if (result.success && result.jobId) {
        setCurrentJob({ id: result.jobId });
        setShowProgress(true);
        
        // Clear form
        setMessage("");
        setRecipients([]);
        
        // Refresh credits
        refetchCredits();
        
        // Start polling job status
        pollJobStatus(result.jobId);
      }
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const pollJobStatus = async (jobId: string) => {
    try {
      const status = await getJobStatus(jobId);
      setJobStats(status);
      
      // Continue polling if job is not complete
      if (status.job.status === 'queued' || status.job.status === 'processing') {
        setTimeout(() => pollJobStatus(jobId), 2000);
      }
    } catch (error) {
      console.error('Error polling job status:', error);
    }
  };

  const formatPhoneForDisplay = (e164: string) => {
    return e164.startsWith('+244') ? e164.substring(4) : e164;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="glass-card p-8 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="relative">
            <h1 className="text-4xl font-light mb-2 gradient-text">Envio Rápido</h1>
            <p className="text-muted-foreground text-lg">
              Envie SMS para um ou múltiplos destinatários instantaneamente
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recipients */}
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Destinatários ({recipients.length})
                </CardTitle>
                <CardDescription>
                  Adicione números de telefone manualmente ou em lote
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="single" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="single">Número Único</TabsTrigger>
                    <TabsTrigger value="bulk">Lista/CSV</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="single" className="space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="phone">Telefone (+244)</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="phone"
                              placeholder="9XXXXXXXX"
                              value={phoneInput}
                              onChange={(e) => setPhoneInput(e.target.value)}
                              className="pl-10"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addSinglePhone();
                                }
                              }}
                            />
                          </div>
                          <Button onClick={addSinglePhone} size="icon">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="bulk" className="space-y-4">
                    <div>
                      <Label htmlFor="bulk">Colar Lista</Label>
                      <Textarea
                        id="bulk"
                        placeholder="Cole números separados por linha, vírgula ou ponto-e-vírgula&#10;9XXXXXXXX&#10;9XXXXXXXX&#10;..."
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                        rows={4}
                      />
                      <Button onClick={addBulkPhones} className="mt-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Lista
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Recipients List */}
                {recipients.length > 0 && (
                  <div className="space-y-2">
                    <Label>Lista de Destinatários</Label>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {recipients.map((phone) => (
                        <div key={phone} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <span className="font-mono text-sm">{formatPhoneForDisplay(phone)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRecipient(phone)}
                          >
                            <X className="h-4 w-4" />
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
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Mensagem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Digite sua mensagem aqui..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                    <span>
                      {message.length} caracteres
                    </span>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {segmentInfo.encoding}
                      </Badge>
                      <Badge variant="outline">
                        {segmentInfo.segments} SMS
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Remetente</Label>
                  <Select value={senderId} onValueChange={setSenderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar remetente" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSenderIdForDropdown().map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <span>{option.label}</span>
                            {option.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                Padrão
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle>Resumo do Envio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Destinatários:</span>
                  <Badge variant="outline">{recipients.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>SMS por destinatário:</span>
                  <Badge variant="outline">{segmentInfo.segments}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total de SMS:</span>
                  <Badge variant="outline">{recipients.length * segmentInfo.segments}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Créditos estimados:</span>
                  <Badge variant={credits >= creditsEstimated ? "default" : "destructive"}>
                    {creditsEstimated}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Créditos disponíveis:</span>
                  <Badge variant="outline">{credits}</Badge>
                </div>

                <Button 
                  className="w-full button-futuristic" 
                  onClick={handleSend}
                  disabled={!message.trim() || recipients.length === 0 || credits < creditsEstimated || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Agora
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle>Dicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Use números no formato 9XXXXXXXX</p>
                <p>• Evite caracteres especiais para economia</p>
                <p>• Mensagens longas são divididas automaticamente</p>
                <p>• O remetente padrão é SMSAO</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Progress Modal */}
      <Dialog open={showProgress} onOpenChange={setShowProgress}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Progresso do Envio
            </DialogTitle>
            <DialogDescription>
              Acompanhe o envio das suas mensagens em tempo real
            </DialogDescription>
          </DialogHeader>
          
          {jobStats && (
            <div className="space-y-6">
              {/* Progress Overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <Badge variant={jobStats.job.status === 'completed' ? 'default' : 'secondary'}>
                    {jobStats.job.status === 'completed' ? 'Concluído' : 
                     jobStats.job.status === 'processing' ? 'Processando' : 'Na Fila'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm font-medium">Créditos</span>
                  </div>
                  <span className="text-sm">{jobStats.job.credits_spent} / {jobStats.job.credits_estimated}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-5 gap-2">
                <div className="text-center p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <div className="text-2xl font-bold text-gray-500">{jobStats.stats.queued}</div>
                  <div className="text-xs text-muted-foreground">Na Fila</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                  <div className="text-2xl font-bold text-yellow-600">{jobStats.stats.sending}</div>
                  <div className="text-xs text-muted-foreground">Enviando</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <div className="text-2xl font-bold text-blue-600">{jobStats.stats.sent}</div>
                  <div className="text-xs text-muted-foreground">Enviadas</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <div className="text-2xl font-bold text-green-600">{jobStats.stats.delivered}</div>
                  <div className="text-xs text-muted-foreground">Entregues</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-100 dark:bg-red-900/20">
                  <div className="text-2xl font-bold text-red-600">{jobStats.stats.failed}</div>
                  <div className="text-xs text-muted-foreground">Falharam</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>{Math.round(((jobStats.stats.sent + jobStats.stats.delivered + jobStats.stats.failed) / jobStats.job.total_recipients) * 100)}%</span>
                </div>
                <Progress 
                  value={((jobStats.stats.sent + jobStats.stats.delivered + jobStats.stats.failed) / jobStats.job.total_recipients) * 100} 
                  className="w-full"
                />
              </div>

              {/* Recent Targets */}
              {jobStats.recentTargets && jobStats.recentTargets.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Últimos Envios</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {jobStats.recentTargets.slice(0, 10).map((target: any) => (
                      <div key={target.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <span className="font-mono">{formatPhoneForDisplay(target.phone_e164)}</span>
                        <div className="flex items-center gap-2">
                          {target.status === 'delivered' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {target.status === 'sent' && <Clock className="h-4 w-4 text-blue-500" />}
                          {target.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
                          <Badge variant="outline" className="text-xs">
                            {target.status === 'delivered' ? 'Entregue' :
                             target.status === 'sent' ? 'Enviado' :
                             target.status === 'failed' ? 'Falhou' : target.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default QuickSend;