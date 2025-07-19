import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Calendar, Users, Zap, Clock, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";

const NewCampaign = () => {
  const [formData, setFormData] = useState({
    name: "",
    message: "",
    sendType: "immediate", // immediate, scheduled
    scheduledDate: "",
    scheduledTime: "",
    contactList: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [messageLength, setMessageLength] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const maxLength = 160;
  const smsCount = Math.ceil(messageLength / maxLength);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'message') {
      setMessageLength(value.length);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para a campanha.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.message.trim()) {
      toast({
        title: "Mensagem obrigatória",
        description: "Por favor, escreva a mensagem da campanha.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.contactList) {
      toast({
        title: "Lista de contatos obrigatória",
        description: "Selecione uma lista de contatos para enviar.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Campanha criada com sucesso!",
        description: formData.sendType === 'immediate' 
          ? "Sua campanha foi enviada e está sendo processada."
          : "Sua campanha foi agendada com sucesso.",
      });
      
      navigate("/campaigns");
    } catch (error) {
      toast({
        title: "Erro ao criar campanha",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="glass-card p-6 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="flex items-center gap-4 relative">
            <Button
              variant="outline"
              onClick={() => navigate("/campaigns")}
              className="glass-card border-glass-border hover:scale-105 transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-light gradient-text">Nova Campanha SMS</h1>
              <p className="text-muted-foreground">
                Crie e configure sua campanha de marketing
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 gradient-text">
                  <MessageSquare className="h-5 w-5" />
                  Configuração da Campanha
                </CardTitle>
                <CardDescription>
                  Defina os detalhes da sua campanha de SMS marketing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Campaign Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-base">Nome da Campanha</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Promoção Black Friday 2024"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="h-12 rounded-2xl glass-card border-glass-border"
                    />
                  </div>

                  {/* Contact List */}
                  <div className="space-y-2">
                    <Label className="text-base">Lista de Contatos</Label>
                    <Select onValueChange={(value) => handleInputChange('contactList', value)}>
                      <SelectTrigger className="h-12 rounded-2xl glass-card border-glass-border">
                        <SelectValue placeholder="Selecione uma lista de contatos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Contatos (1.2K)</SelectItem>
                        <SelectItem value="customers">Clientes Ativos (850)</SelectItem>
                        <SelectItem value="prospects">Prospects (350)</SelectItem>
                        <SelectItem value="vip">Clientes VIP (120)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-base">Mensagem</Label>
                    <Textarea
                      id="message"
                      placeholder="Digite sua mensagem aqui... Use {nome} para personalizar com o nome do contato."
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className="min-h-32 rounded-2xl glass-card border-glass-border resize-none"
                      maxLength={480}
                    />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Use variáveis: {"{nome}"}, {"{empresa}"}, {"{telefone}"}
                      </span>
                      <span className={`${messageLength > maxLength ? 'text-orange-500' : 'text-muted-foreground'}`}>
                        {messageLength}/480 caracteres • {smsCount} SMS
                      </span>
                    </div>
                  </div>

                  {/* Send Type */}
                  <div className="space-y-4">
                    <Label className="text-base">Tipo de Envio</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Card 
                        className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                          formData.sendType === 'immediate' 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'glass-card border-glass-border'
                        }`}
                        onClick={() => handleInputChange('sendType', 'immediate')}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="p-3 rounded-2xl bg-gradient-primary shadow-glow w-fit mx-auto mb-3">
                            <Zap className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="font-medium">Envio Imediato</h3>
                          <p className="text-sm text-muted-foreground">Enviar agora</p>
                        </CardContent>
                      </Card>
                      
                      <Card 
                        className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                          formData.sendType === 'scheduled' 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'glass-card border-glass-border'
                        }`}
                        onClick={() => handleInputChange('sendType', 'scheduled')}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="p-3 rounded-2xl bg-gradient-primary shadow-glow w-fit mx-auto mb-3">
                            <Calendar className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="font-medium">Agendar Envio</h3>
                          <p className="text-sm text-muted-foreground">Programar data/hora</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Schedule Fields */}
                  {formData.sendType === 'scheduled' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="scheduledDate">Data</Label>
                        <Input
                          id="scheduledDate"
                          type="date"
                          value={formData.scheduledDate}
                          onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                          className="h-12 rounded-2xl glass-card border-glass-border"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="scheduledTime">Hora</Label>
                        <Input
                          id="scheduledTime"
                          type="time"
                          value={formData.scheduledTime}
                          onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                          className="h-12 rounded-2xl glass-card border-glass-border"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full button-futuristic text-lg py-6" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Processando..."
                    ) : (
                      <>
                        {formData.sendType === 'immediate' ? (
                          <>
                            <Send className="h-5 w-5 mr-2" />
                            Enviar Campanha
                          </>
                        ) : (
                          <>
                            <Clock className="h-5 w-5 mr-2" />
                            Agendar Campanha
                          </>
                        )}
                      </>
                    )}
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
                <div className="bg-muted/20 rounded-2xl p-4 border-l-4 border-primary">
                  <div className="text-xs text-muted-foreground mb-2">SMS Preview</div>
                  <div className="font-mono text-sm">
                    {formData.message || "Digite sua mensagem para ver o preview..."}
                  </div>
                  {messageLength > 0 && (
                    <div className="mt-3 flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {smsCount} SMS • {messageLength} caracteres
                      </span>
                      <Badge variant={smsCount > 1 ? "destructive" : "default"}>
                        {smsCount > 1 ? `${smsCount}x créditos` : "1 crédito"}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Campaign Summary */}
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle className="gradient-text">Resumo da Campanha</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{formData.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lista:</span>
                  <span className="font-medium">
                    {formData.contactList === 'all' && "Todos (1.2K)"}
                    {formData.contactList === 'customers' && "Clientes (850)"}
                    {formData.contactList === 'prospects' && "Prospects (350)"}
                    {formData.contactList === 'vip' && "VIP (120)"}
                    {!formData.contactList && "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">
                    {formData.sendType === 'immediate' ? "Imediato" : "Agendado"}
                  </span>
                </div>
                {formData.sendType === 'scheduled' && formData.scheduledDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data/Hora:</span>
                    <span className="font-medium text-sm">
                      {new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleString('pt-BR')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Créditos:</span>
                  <span className="font-medium text-primary">
                    {smsCount * (
                      formData.contactList === 'all' ? 1200 :
                      formData.contactList === 'customers' ? 850 :
                      formData.contactList === 'prospects' ? 350 :
                      formData.contactList === 'vip' ? 120 : 0
                    )} SMS
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="card-futuristic border-blue-500/30 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="text-blue-400 text-lg">💡 Dicas para Sucesso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Use chamadas para ação claras (ex: "Compre agora")</p>
                <p>• Inclua links encurtados para rastreamento</p>
                <p>• Personalize com o nome do cliente</p>
                <p>• Teste o horário ideal para seu público</p>
                <p>• Mantenha mensagens concisas e diretas</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewCampaign;