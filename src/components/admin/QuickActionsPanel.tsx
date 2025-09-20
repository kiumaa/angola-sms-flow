import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Zap, 
  UserPlus, 
  MessageSquare, 
  CreditCard, 
  Settings, 
  TestTube,
  Plus,
  Send,
  DollarSign,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SecurityEnhancementModal } from "./SecurityEnhancementModal";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  action: () => void;
}

export const QuickActionsPanel = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // SMS Modal State
  const [smsData, setSmsData] = useState({
    phone: "",
    message: "",
    senderId: "SMSAO"
  });

  // User Modal State
  const [userData, setUserData] = useState({
    email: "",
    fullName: "",
    credits: "5"
  });

  // Credit Modal State
  const [creditData, setCreditData] = useState({
    userEmail: "",
    amount: "",
    reason: ""
  });

  const quickActions: QuickAction[] = [
    {
      id: 'send-sms',
      title: 'Enviar SMS',
      description: 'Envio rápido de SMS teste',
      icon: MessageSquare,
      color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20',
      action: () => setShowSMSModal(true)
    },
    {
      id: 'create-user',
      title: 'Criar Usuário',
      description: 'Adicionar novo usuário',
      icon: UserPlus,
      color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20',
      action: () => setShowUserModal(true)
    },
    {
      id: 'add-credits',
      title: 'Adicionar Créditos',
      description: 'Ajuste rápido de créditos',
      icon: CreditCard,
      color: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20',
      action: () => setShowCreditModal(true)
    },
    {
      id: 'test-gateway',
      title: 'Testar Gateway',
      description: 'Teste de conectividade',
      icon: TestTube,
      color: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20',
      action: () => window.open('/admin/sms-test', '_blank')
    },
    {
      id: 'security-scan',
      title: 'Scan Segurança',
      description: 'Verificação rápida',
      icon: Shield,
      color: 'bg-red-500/10 text-red-600 hover:bg-red-500/20',
      action: () => setShowSecurityModal(true)
    },
    {
      id: 'system-status',
      title: 'Status Sistema',
      description: 'Monitoramento geral',
      icon: Settings,
      color: 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20',
      action: () => window.open('/admin/production', '_blank')
    }
  ];

  const handleSendSMS = async () => {
    if (!smsData.phone || !smsData.message) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('send-quick-sms', {
        body: {
          phone: smsData.phone,
          message: smsData.message,
          senderId: smsData.senderId
        }
      });

      if (error) throw error;

      toast({ title: "SMS enviado com sucesso!", description: `Mensagem enviada para ${smsData.phone}` });
      setShowSMSModal(false);
      setSmsData({ phone: "", message: "", senderId: "SMSAO" });
    } catch (error) {
      toast({ title: "Erro ao enviar SMS", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateUser = async () => {
    if (!userData.email || !userData.fullName) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    try {
      // Create user through Supabase auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: Math.random().toString(36).slice(-8), // Temporary password
        email_confirm: true,
        user_metadata: {
          full_name: userData.fullName
        }
      });

      if (error) throw error;

      toast({ 
        title: "Usuário criado com sucesso!", 
        description: `${userData.fullName} (${userData.email}) foi adicionado` 
      });
      setShowUserModal(false);
      setUserData({ email: "", fullName: "", credits: "5" });
    } catch (error) {
      toast({ title: "Erro ao criar usuário", description: error.message, variant: "destructive" });
    }
  };

  const handleAddCredits = async () => {
    if (!creditData.userEmail || !creditData.amount) {
      toast({ title: "Erro", description: "Preencha email e valor", variant: "destructive" });
      return;
    }

    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id, credits')
        .eq('email', creditData.userEmail)
        .single();

      if (profileError || !profile) {
        throw new Error('Usuário não encontrado');
      }

      // Add credits
      const { error } = await supabase
        .from('profiles')
        .update({ credits: profile.credits + parseInt(creditData.amount) })
        .eq('id', profile.id);

      if (error) throw error;

      // Log the credit adjustment
      await supabase
        .from('credit_adjustments')
        .insert({
          user_id: profile.user_id,
          admin_id: user?.id,
          delta: parseInt(creditData.amount),
          previous_balance: profile.credits,
          new_balance: profile.credits + parseInt(creditData.amount),
          reason: creditData.reason || 'Ajuste manual pelo admin',
          adjustment_type: 'manual_adjustment'
        });

      toast({ 
        title: "Créditos adicionados!", 
        description: `${creditData.amount} créditos adicionados para ${creditData.userEmail}` 
      });
      setShowCreditModal(false);
      setCreditData({ userEmail: "", amount: "", reason: "" });
    } catch (error) {
      toast({ title: "Erro ao adicionar créditos", description: error.message, variant: "destructive" });
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowPanel(true)}
        className="rounded-xl hover-lift text-primary"
      >
        <Zap className="h-4 w-4 mr-2" />
        Quick Actions
      </Button>

      <Dialog open={showPanel} onOpenChange={setShowPanel}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <span>Ações Rápidas</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                onClick={action.action}
                className={`h-24 flex flex-col items-center space-y-2 rounded-xl border ${action.color} transition-all duration-200`}
              >
                <action.icon className="h-6 w-6" />
                <div className="text-center">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-xs opacity-75">{action.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* SMS Modal */}
      <Dialog open={showSMSModal} onOpenChange={setShowSMSModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar SMS Teste</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="+244900000000"
                value={smsData.phone}
                onChange={(e) => setSmsData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem..."
                value={smsData.message}
                onChange={(e) => setSmsData(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="senderId">Sender ID</Label>
              <Select value={smsData.senderId} onValueChange={(value) => setSmsData(prev => ({ ...prev, senderId: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMSAO">SMSAO</SelectItem>
                  <SelectItem value="TESTE">TESTE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSendSMS} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Enviar SMS
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={userData.email}
                onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="fullName">Nome Completo</Label>
              <Input
                id="fullName"
                placeholder="Nome do usuário"
                value={userData.fullName}
                onChange={(e) => setUserData(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="credits">Créditos Iniciais</Label>
              <Input
                id="credits"
                type="number"
                value={userData.credits}
                onChange={(e) => setUserData(prev => ({ ...prev, credits: e.target.value }))}
              />
            </div>
            <Button onClick={handleCreateUser} className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              Criar Usuário
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credit Modal */}
      <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Créditos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="userEmail">Email do Usuário</Label>
              <Input
                id="userEmail"
                type="email"
                placeholder="usuario@exemplo.com"
                value={creditData.userEmail}
                onChange={(e) => setCreditData(prev => ({ ...prev, userEmail: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="amount">Quantidade de Créditos</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100"
                value={creditData.amount}
                onChange={(e) => setCreditData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Input
                id="reason"
                placeholder="Bônus, ajuste, etc."
                value={creditData.reason}
                onChange={(e) => setCreditData(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            <Button onClick={handleAddCredits} className="w-full">
              <DollarSign className="h-4 w-4 mr-2" />
              Adicionar Créditos
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Security Enhancement Modal */}
      <SecurityEnhancementModal 
        open={showSecurityModal} 
        onOpenChange={setShowSecurityModal} 
      />
    </>
  );
};