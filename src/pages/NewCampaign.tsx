import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send, Upload, ArrowLeft, Users, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";

const NewCampaign = () => {
  const [campaignName, setCampaignName] = useState("");
  const [message, setMessage] = useState("");
  const [recipients, setRecipients] = useState("");
  const [loading, setLoading] = useState(false);
  const [userCredits, setUserCredits] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserCredits();
  }, []);

  const fetchUserCredits = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('credits')
        .eq('user_id', user?.id)
        .single();
      
      setUserCredits(data?.credits || 0);
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const parseRecipients = (text: string): string[] => {
    // Remove espaços, quebras de linha e separa por vírgulas
    return text
      .split(/[,\n\r]+/)
      .map(num => num.trim())
      .filter(num => num.length > 0)
      .map(num => {
        // Adiciona +244 se não tiver código do país
        if (!num.startsWith('+')) {
          return `+244${num}`;
        }
        return num;
      });
  };

  const handleCreateCampaign = async () => {
    if (!campaignName.trim() || !message.trim() || !recipients.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const recipientList = parseRecipients(recipients);
    
    if (recipientList.length === 0) {
      toast({
        title: "Destinatários inválidos",
        description: "Por favor, adicione pelo menos um número válido",
        variant: "destructive",
      });
      return;
    }

    if (recipientList.length > userCredits) {
      toast({
        title: "Créditos insuficientes",
        description: `Você tem ${userCredits} créditos mas precisa de ${recipientList.length}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Criar campanha no banco
      const { data: campaign, error: campaignError } = await supabase
        .from('sms_campaigns')
        .insert({
          user_id: user?.id,
          name: campaignName,
          message: message,
          total_recipients: recipientList.length,
          status: 'sending'
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Enviar SMS via edge function
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          campaignId: campaign.id,
          recipients: recipientList,
          message: message
        }
      });

      if (error) throw error;

      toast({
        title: "Campanha enviada!",
        description: `${data.totalSent} SMS enviados com sucesso. ${data.totalFailed} falharam.`,
      });

      // Atualizar créditos localmente
      setUserCredits(data.remainingCredits);

      // Redirecionar para campanhas
      navigate('/campaigns');

    } catch (error: any) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Erro ao enviar campanha",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setRecipients(text);
    
    toast({
      title: "Arquivo carregado",
      description: "Números adicionados com sucesso",
    });
  };

  const recipientCount = parseRecipients(recipients).length;

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link to="/campaigns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Nova Campanha SMS</h1>
            <p className="text-muted-foreground mt-2">
              Crie e envie sua campanha de SMS marketing
            </p>
          </div>
        </div>

        {/* Credits Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Seus Créditos</p>
                <p className="text-2xl font-bold text-primary">{userCredits}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Custo estimado</p>
                <p className="text-lg font-semibold">
                  {recipientCount} crédito{recipientCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Campanha</CardTitle>
                <CardDescription>
                  Configure sua campanha de SMS marketing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Campanha</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Promoção Black Friday"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea
                    id="message"
                    placeholder="Digite sua mensagem SMS aqui..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {message.length}/160 caracteres
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Destinatários</CardTitle>
                <CardDescription>
                  Adicione os números de telefone (um por linha ou separados por vírgula)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipients">Números de Telefone</Label>
                  <Textarea
                    id="recipients"
                    placeholder="Ex: 923456789, 924567890&#10;ou um número por linha"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    rows={6}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {recipientCount} destinatário{recipientCount !== 1 ? 's' : ''} detectado{recipientCount !== 1 ? 's' : ''}
                  </p>
                </div>

                <div>
                  <Label htmlFor="file">Ou carregue um arquivo (.txt, .csv)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileUpload}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  Como sua mensagem aparecerá
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 min-h-[120px]">
                  <div className="flex items-start space-x-2">
                    <MessageSquare className="h-4 w-4 text-primary mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">SMSao</p>
                      <p className="text-sm mt-1">
                        {message || "Sua mensagem aparecerá aqui..."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Destinatários:</span>
                    <span className="font-medium">{recipientCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Custo:</span>
                    <span className="font-medium">{recipientCount} créditos</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Após envio:</span>
                    <span className="font-medium">{userCredits - recipientCount} créditos</span>
                  </div>
                </div>

                <Button 
                  className="w-full mt-6 btn-gradient" 
                  onClick={handleCreateCampaign}
                  disabled={loading || recipientCount === 0 || recipientCount > userCredits}
                >
                  {loading ? (
                    "Enviando..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Campanha
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewCampaign;