import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  AlertTriangle
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
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground mt-2">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Settings className="h-8 w-8" />
            <span>Configurações</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas informações pessoais e preferências da conta
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="account">Conta</TabsTrigger>
            <TabsTrigger value="billing">Faturação</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informações do Perfil</span>
                </CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais e empresariais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Nome Completo</Label>
                    <Input
                      id="fullName"
                      placeholder="Seu nome completo"
                      value={profile.full_name}
                      onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      O email não pode ser alterado
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="phone"
                        placeholder="+244 900 000 000"
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="company">Empresa</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="company"
                        placeholder="Nome da sua empresa"
                        value={profile.company_name}
                        onChange={(e) => setProfile({...profile, company_name: e.target.value})}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={updateProfile} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="mt-6">
            <div className="space-y-6">
              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Informações da Conta</span>
                  </CardTitle>
                  <CardDescription>
                    Detalhes da sua conta e configurações de segurança
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Email de Login</Label>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                    <Badge variant="outline">Verificado</Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Créditos SMS</Label>
                      <p className="text-sm text-muted-foreground">{profile.credits} créditos disponíveis</p>
                    </div>
                    <Badge variant="secondary">{profile.credits > 0 ? "Ativo" : "Sem créditos"}</Badge>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <div>
                      <Label>Sender ID Padrão</Label>
                      <p className="text-sm text-muted-foreground">{profile.default_sender_id || "SMSao"}</p>
                    </div>
                    <Badge variant="outline">Configurado</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Key className="h-5 w-5" />
                    <span>Alterar Senha</span>
                  </CardTitle>
                  <CardDescription>
                    Mantenha sua conta segura com uma senha forte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Digite sua nova senha"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirme sua nova senha"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    />
                  </div>

                  <Button onClick={updatePassword} variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    Alterar Senha
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Faturação e Créditos</span>
                </CardTitle>
                <CardDescription>
                  Gerencie seus créditos SMS e histórico de compras
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Saldo Atual</h3>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {profile.credits} SMS
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Créditos disponíveis para suas campanhas
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold">Ações Rápidas</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Button variant="outline" asChild>
                      <a href="/checkout">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Comprar Créditos
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/transactions">
                        <Mail className="h-4 w-4 mr-2" />
                        Ver Histórico
                      </a>
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-semibold">Informações de Faturação</h4>
                  <p className="text-sm text-muted-foreground">
                    • Pagamentos processados via transferência bancária
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • Créditos adicionados em até 24h após confirmação
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • Suporte disponível via email para dúvidas
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notificações</span>
                </CardTitle>
                <CardDescription>
                  Configure como você quer receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Campanhas Concluídas</h4>
                      <p className="text-sm text-muted-foreground">
                        Receber notificação quando uma campanha for finalizada
                      </p>
                    </div>
                    <Badge variant="outline">Em breve</Badge>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Créditos Baixos</h4>
                      <p className="text-sm text-muted-foreground">
                        Avisar quando os créditos estiverem acabando
                      </p>
                    </div>
                    <Badge variant="outline">Em breve</Badge>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">Pagamentos Aprovados</h4>
                      <p className="text-sm text-muted-foreground">
                        Confirmar quando um pagamento for processado
                      </p>
                    </div>
                    <Badge variant="outline">Em breve</Badge>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Sistema de Notificações</h4>
                    <p className="text-sm text-muted-foreground">
                      As notificações automáticas serão implementadas em uma próxima atualização.
                      Por enquanto, você pode acompanhar tudo através do dashboard.
                    </p>
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