import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, Clock, Users, MessageSquare, Send, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CampaignWizardProps {
  onSubmit: (campaign: any) => void;
  onCancel: () => void;
  contacts: any[];
  contactLists: any[];
}

export function CampaignWizard({ onSubmit, onCancel, contacts, contactLists }: CampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [campaign, setCampaign] = useState({
    name: "",
    message: "",
    selectedContacts: [] as string[],
    selectedLists: [] as string[],
    scheduledAt: null as Date | null,
    scheduleType: "immediate",
    variables: {} as Record<string, string>
  });

  const steps = ["Configuração", "Destinatários", "Mensagem", "Agendamento", "Revisão"];

  const calculateSMSCount = (message: string) => {
    const length = message.length;
    if (length <= 160) return 1;
    return Math.ceil(length / 153); // 153 chars for concatenated SMS
  };

  const getTotalRecipients = () => {
    const directContacts = campaign.selectedContacts.length;
    const listContacts = campaign.selectedLists.reduce((total, listId) => {
      const list = contactLists.find(l => l.id === listId);
      return total + (list?.contact_count || 0);
    }, 0);
    return directContacts + listContacts;
  };

  const previewMessage = () => {
    let preview = campaign.message;
    Object.entries(campaign.variables).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    return preview;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const totalRecipients = getTotalRecipients();
    const smsCount = calculateSMSCount(campaign.message);
    const totalCredits = totalRecipients * smsCount;

    onSubmit({
      ...campaign,
      totalRecipients,
      smsCount,
      totalCredits
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Configuração
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Nome da Campanha</Label>
              <Input
                id="name"
                placeholder="Ex: Promoção Black Friday 2024"
                value={campaign.name}
                onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
              />
            </div>
          </div>
        );

      case 1: // Destinatários
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Selecionar Destinatários</h3>
              
              {/* Contact Lists */}
              <div className="mb-6">
                <Label className="text-base">Listas de Contatos</Label>
                <div className="mt-2 space-y-2">
                  {contactLists.map((list) => (
                    <div key={list.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`list-${list.id}`}
                        checked={campaign.selectedLists.includes(list.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCampaign({
                              ...campaign,
                              selectedLists: [...campaign.selectedLists, list.id]
                            });
                          } else {
                            setCampaign({
                              ...campaign,
                              selectedLists: campaign.selectedLists.filter(id => id !== list.id)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`list-${list.id}`} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <span>{list.name}</span>
                          <Badge variant="secondary">{list.contact_count} contatos</Badge>
                        </div>
                        {list.description && (
                          <p className="text-sm text-muted-foreground">{list.description}</p>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual Contacts */}
              <div>
                <Label className="text-base">Contatos Individuais</Label>
                <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`contact-${contact.id}`}
                        checked={campaign.selectedContacts.includes(contact.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCampaign({
                              ...campaign,
                              selectedContacts: [...campaign.selectedContacts, contact.id]
                            });
                          } else {
                            setCampaign({
                              ...campaign,
                              selectedContacts: campaign.selectedContacts.filter(id => id !== contact.id)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`contact-${contact.id}`} className="cursor-pointer">
                        {contact.name} - {contact.phone}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800">
                  <Users className="inline h-4 w-4 mr-1" />
                  Total de destinatários selecionados: <strong>{getTotalRecipients()}</strong>
                </p>
              </div>
            </div>
          </div>
        );

      case 2: // Mensagem
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="message">Mensagem SMS</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem... Use {nome} para personalizar"
                value={campaign.message}
                onChange={(e) => setCampaign({ ...campaign, message: e.target.value })}
                rows={4}
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>{campaign.message.length} caracteres</span>
                <span>{calculateSMSCount(campaign.message)} SMS</span>
              </div>
            </div>

            {/* Variables */}
            <div>
              <Label className="text-base">Variáveis Detectadas</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Configure valores padrão para as variáveis encontradas na mensagem
              </p>
              {campaign.message.match(/{(\w+)}/g)?.map((match) => {
                const variable = match.slice(1, -1);
                return (
                  <div key={variable} className="flex items-center space-x-2 mb-2">
                    <Label className="w-20">{variable}:</Label>
                    <Input
                      placeholder={`Valor padrão para {${variable}}`}
                      value={campaign.variables[variable] || ""}
                      onChange={(e) => setCampaign({
                        ...campaign,
                        variables: { ...campaign.variables, [variable]: e.target.value }
                      })}
                    />
                  </div>
                );
              })}
            </div>

            {/* Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <Label className="text-base">Preview da Mensagem</Label>
              <div className="mt-2 p-3 bg-white border rounded text-sm">
                <MessageSquare className="inline h-4 w-4 mr-1" />
                {previewMessage() || "Sua mensagem aparecerá aqui..."}
              </div>
            </div>
          </div>
        );

      case 3: // Agendamento
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base">Quando enviar?</Label>
              <Select
                value={campaign.scheduleType}
                onValueChange={(value) => setCampaign({ ...campaign, scheduleType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Enviar Imediatamente</SelectItem>
                  <SelectItem value="scheduled">Agendar para Data/Hora Específica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {campaign.scheduleType === "scheduled" && (
              <div className="space-y-4">
                <div>
                  <Label>Data e Hora do Envio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !campaign.scheduledAt && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {campaign.scheduledAt ? (
                          format(campaign.scheduledAt, "PPP 'às' HH:mm", { locale: ptBR })
                        ) : (
                          "Selecione data e hora"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={campaign.scheduledAt}
                        onSelect={(date) => setCampaign({ ...campaign, scheduledAt: date })}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>
        );

      case 4: // Revisão
        const totalRecipients = getTotalRecipients();
        const smsCount = calculateSMSCount(campaign.message);
        const totalCredits = totalRecipients * smsCount;

        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Revisão da Campanha</h3>
            
            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Nome:</span>
                    <span className="font-medium">{campaign.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envio:</span>
                    <span className="font-medium">
                      {campaign.scheduleType === "immediate" ? "Imediato" : 
                       campaign.scheduledAt ? format(campaign.scheduledAt, "PPP 'às' HH:mm", { locale: ptBR }) : "Agendado"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Destinatários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium text-primary">{totalRecipients} contatos</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Custo Estimado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>SMS por contato:</span>
                    <span className="font-medium">{smsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de créditos:</span>
                    <span className="font-medium text-primary">{totalCredits}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Preview da Mensagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-gray-50 rounded border">
                    {previewMessage()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Nova Campanha SMS</h2>
        <p className="text-muted-foreground">Configure sua campanha passo a passo</p>
      </div>

      <ProgressSteps steps={steps} currentStep={currentStep} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {currentStep === 0 && <MessageSquare className="h-5 w-5" />}
            {currentStep === 1 && <Users className="h-5 w-5" />}
            {currentStep === 2 && <MessageSquare className="h-5 w-5" />}
            {currentStep === 3 && <Clock className="h-5 w-5" />}
            {currentStep === 4 && <Eye className="h-5 w-5" />}
            <span>{steps[currentStep]}</span>
          </CardTitle>
          <CardDescription>
            Passo {currentStep + 1} de {steps.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <div className="space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          {currentStep > 0 && (
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
          )}
        </div>

        <div>
          {currentStep < steps.length - 1 ? (
            <Button 
              onClick={nextStep}
              disabled={
                (currentStep === 0 && !campaign.name) ||
                (currentStep === 1 && getTotalRecipients() === 0) ||
                (currentStep === 2 && !campaign.message)
              }
            >
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-primary">
              <Send className="h-4 w-4 mr-2" />
              Criar Campanha
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}