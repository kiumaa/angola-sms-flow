import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  Key, 
  Bell, 
  Shield,
  CreditCard,
  Save,
  AlertTriangle,
  Zap,
  Eye,
  EyeOff,
  CheckCircle
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface UserProfile {
  full_name: string;
  email: string;
  phone: string;
  company_name: string;
  credits: number;
  default_sender_id: string;
}

const UserSettings = () => {
  const [profile, setProfile] = useState<UserProfile>({
    full_name: "",
    email: "",
    phone: "",
    company_name: "",
    credits: 0,
    default_sender_id: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false
  });

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      setProfile({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        company_name: data.company_name || "",
        credits: data.credits || 0,
        default_sender_id: data.default_sender_id || ""
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar perfil.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          company_name: profile.company_name
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Erro", 
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast({
        title: "Senha alterada",
        description: "Sua senha foi atualizada com sucesso.",
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar senha.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="glass-card p-8 animate-float">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-3xl bg-gradient-primary shadow-glow animate-glow">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-light gradient-text">Configurações</h1>
                <p className="text-muted-foreground mt-1">Carregando suas preferências...</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <div className="glass-card p-8 bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
          <div className="relative">
            <h1 className="text-4xl font-light gradient-text mb-2 flex items-center space-x-3">
              <div className="p-3 rounded-3xl bg-gradient-primary shadow-glow animate-glow">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <span>Configurações Avançadas</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Personalize sua conta e otimize sua experiência na plataforma
            </p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 glass-card rounded-2xl p-1">
            <TabsTrigger value="profile" className="rounded-xl">Perfil</TabsTrigger>
            <TabsTrigger value="account" className="rounded-xl">Conta</TabsTrigger>
            <TabsTrigger value="billing" className="rounded-xl">Faturação</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-xl">Notificações</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-8">
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle className="text-2xl font-light gradient-text flex items-center space-x-3">
                  <div className="p-2 rounded-2xl bg-gradient-primary shadow-glow">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <span>Informações do Perfil</span>
                </CardTitle>
                <CardDescription className="text-lg">
                  Mantenha seus dados atualizados para melhor experiência
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-base">Nome Completo</Label>
                    <Input
                      id="fullName"
                      placeholder="Seu nome completo"
                      value={profile.full_name}
                      onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                      className="rounded-2xl h-12 glass-card border-glass-border"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="rounded-2xl h-12 glass-card bg-muted border-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      📧 O email não pode ser alterado por segurança
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-base">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="phone"
                        placeholder="+244 900 000 000"
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        className="rounded-2xl h-12 glass-card border-glass-border pl-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-base">Empresa</Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="company"
                        placeholder="Nome da sua empresa"
                        value={profile.company_name}
                        onChange={(e) => setProfile({...profile, company_name: e.target.value})}
                        className="rounded-2xl h-12 glass-card border-glass-border pl-12"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={updateProfile} disabled={saving} className="button-futuristic">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="mt-8">
            <div className="space-y-8">
              {/* Account Info */}
              <Card className="card-futuristic">
                <CardHeader>
                  <CardTitle className="text-2xl font-light gradient-text flex items-center space-x-3">
                    <div className="p-2 rounded-2xl bg-gradient-primary shadow-glow">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <span>Segurança da Conta</span>
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Status e configurações de segurança da sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="glass-card p-4 rounded-2xl text-center">
                      <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                      <Label className="text-base block mb-1">Email de Login</Label>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                      <Badge className="bg-green-500 text-white mt-2">✓ Verificado</Badge>
                    </div>
                    
                    <div className="glass-card p-4 rounded-2xl text-center">
                      <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
                      <Label className="text-base block mb-1">Créditos SMS</Label>
                      <p className="text-sm text-muted-foreground">{profile.credits} disponíveis</p>
                      <Badge className={`mt-2 ${profile.credits > 0 ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                        {profile.credits > 0 ? "Ativo" : "Sem créditos"}
                      </Badge>
                    </div>

                    <div className="glass-card p-4 rounded-2xl text-center">
                      <Settings className="h-8 w-8 text-primary mx-auto mb-2" />
                      <Label className="text-base block mb-1">Sender ID Padrão</Label>
                      <p className="text-sm text-muted-foreground">{profile.default_sender_id || "SMS.AO"}</p>
                      <Badge className="bg-blue-500 text-white mt-2">Configurado</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card className="card-futuristic">
                <CardHeader>
                  <CardTitle className="text-2xl font-light gradient-text flex items-center space-x-3">
                    <div className="p-2 rounded-2xl bg-gradient-primary shadow-glow">
                      <Key className="h-5 w-5 text-white" />
                    </div>
                    <span>Alterar Senha</span>
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Mantenha sua conta segura com uma senha forte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-base">Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword.new ? "text" : "password"}
                          placeholder="Digite sua nova senha"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                          className="rounded-2xl h-12 glass-card border-glass-border pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-base">Confirmar Nova Senha</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPassword.confirm ? "text" : "password"}
                          placeholder="Confirme sua nova senha"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                          className="rounded-2xl h-12 glass-card border-glass-border pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button onClick={updatePassword} className="button-futuristic">
                    <Key className="h-4 w-4 mr-2" />
                    Alterar Senha
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="mt-8">
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle className="text-2xl font-light gradient-text flex items-center space-x-3">
                  <div className="p-2 rounded-2xl bg-gradient-primary shadow-glow">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <span>Centro de Faturação</span>
                </CardTitle>
                <CardDescription className="text-lg">
                  Gerencie seus créditos SMS e histórico financeiro
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="glass-card p-6 rounded-3xl bg-gradient-primary/5 border border-primary/20">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-2xl bg-gradient-primary shadow-glow">
                        <Zap className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-xl gradient-text">Saldo Atual</h3>
                        <p className="text-sm text-muted-foreground">Créditos disponíveis para campanhas</p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-primary text-white text-xl px-6 py-3 rounded-2xl shadow-glow">
                      {profile.credits} SMS
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-6">
                  <h4 className="font-semibold text-xl gradient-text">🚀 Ações Rápidas</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Button asChild className="button-futuristic h-16 text-lg rounded-2xl">
                      <a href="/checkout">
                        <CreditCard className="h-6 w-6 mr-3" />
                        Comprar Mais Créditos
                      </a>
                    </Button>
                    <Button asChild variant="outline" className="glass-card border-glass-border h-16 text-lg rounded-2xl hover:scale-105 transition-all">
                      <a href="/transactions">
                        <Mail className="h-6 w-6 mr-3" />
                        Histórico de Transações
                      </a>
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold text-xl gradient-text">💳 Informações de Pagamento</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="glass-card p-4 rounded-2xl text-center">
                      <div className="text-2xl mb-2">🏦</div>
                      <p className="text-sm font-medium">Transferência Bancária</p>
                      <p className="text-xs text-muted-foreground">Pagamento seguro</p>
                    </div>
                    <div className="glass-card p-4 rounded-2xl text-center">
                      <div className="text-2xl mb-2">⚡</div>
                      <p className="text-sm font-medium">Processamento Rápido</p>
                      <p className="text-xs text-muted-foreground">Até 24h para ativar</p>
                    </div>
                    <div className="glass-card p-4 rounded-2xl text-center">
                      <div className="text-2xl mb-2">🆘</div>
                      <p className="text-sm font-medium">Suporte Premium</p>
                      <p className="text-xs text-muted-foreground">Ajuda especializada</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-8">
            <Card className="card-futuristic">
              <CardHeader>
                <CardTitle className="text-2xl font-light gradient-text flex items-center space-x-3">
                  <div className="p-2 rounded-2xl bg-gradient-primary shadow-glow">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <span>Central de Notificações</span>
                </CardTitle>
                <CardDescription className="text-lg">
                  Personalize como você recebe atualizações importantes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between glass-card p-4 rounded-2xl">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-xl bg-green-500/20">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Campanhas Concluídas</h4>
                        <p className="text-sm text-muted-foreground">
                          Receber notificação quando uma campanha for finalizada
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="px-4 py-2">Em breve</Badge>
                  </div>

                  <div className="flex items-center justify-between glass-card p-4 rounded-2xl">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-xl bg-yellow-500/20">
                        <Zap className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Créditos Baixos</h4>
                        <p className="text-sm text-muted-foreground">
                          Avisar quando os créditos estiverem acabando
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="px-4 py-2">Em breve</Badge>
                  </div>

                  <div className="flex items-center justify-between glass-card p-4 rounded-2xl">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-xl bg-blue-500/20">
                        <CreditCard className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Pagamentos Aprovados</h4>
                        <p className="text-sm text-muted-foreground">
                          Confirmar quando um pagamento for processado
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="px-4 py-2">Em breve</Badge>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-3xl bg-yellow-500/5 border border-yellow-500/20">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 rounded-xl bg-yellow-500/20 mt-1">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg gradient-text mb-2">🔔 Sistema de Notificações Avançado</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Estamos desenvolvendo um sistema completo de notificações em tempo real com:
                      </p>
                      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Notificações push no navegador</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Alertas por email personalizados</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> WhatsApp para atualizações importantes</li>
                        <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Dashboard em tempo real</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default UserSettings;