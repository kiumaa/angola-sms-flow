import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Zap, Check, X, Shield, User, Mail, Phone, Building, ChevronLeft, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useRegistrationSettings } from '@/hooks/useRegistrationSettings';
import OTPRegistrationModal from '@/components/auth/OTPRegistrationModal';
import { normalizeInternationalPhone, DEFAULT_COUNTRY, type PhoneCountry } from '@/lib/internationalPhoneNormalization';

interface FormData {
  fullName: string;
  company: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

const STEPS = [
  { id: 1, name: 'Dados Pessoais', icon: User },
  { id: 2, name: 'Contato', icon: Mail },
  { id: 3, name: 'Segurança', icon: Shield },
  { id: 4, name: 'Finalização', icon: Check }
];

const COUNTRY_CODES = [
  { code: '+244', country: 'AO', name: 'Angola' },
  { code: '+351', country: 'PT', name: 'Portugal' },
  { code: '+55', country: 'BR', name: 'Brasil' },
  { code: '+1', country: 'US', name: 'Estados Unidos' }
];

export const ModernSignupForm: React.FC = () => {
  const { signUp, user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings } = useRegistrationSettings();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [selectedCountry, setSelectedCountry] = useState<PhoneCountry>(DEFAULT_COUNTRY);
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    company: '',
    email: '',
    phone: '',
    countryCode: '+244',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    strength = Object.values(checks).filter(Boolean).length;
    
    if (strength <= 2) return { level: 'Fraca', color: 'bg-destructive', percentage: 25 };
    if (strength <= 3) return { level: 'Regular', color: 'bg-yellow-500', percentage: 50 };
    if (strength <= 4) return { level: 'Boa', color: 'bg-blue-500', percentage: 75 };
    return { level: 'Forte', color: 'bg-green-500', percentage: 100 };
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.fullName.trim().length > 0;
      case 2:
        return formData.email.includes('@') && formData.phone.length >= 9;
      case 3:
        return formData.password.length >= 8 && formData.password === formData.confirmPassword;
      case 4:
        return formData.acceptTerms;
      default:
        return false;
    }
  };

  const canProceed = isStepValid(currentStep);
  const isCompleted = (step: number) => step < currentStep || (step === currentStep && isStepValid(step));

  const handleNext = () => {
    if (canProceed && currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const createAccount = async () => {
    setIsLoading(true);
    try {
      const { error } = await signUp(formData.email, formData.password, formData.fullName);
      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Conta criada com sucesso! 🎉",
          description: `Bem-vindo à plataforma SMS.AO. Você ganhou ${settings.free_credits_new_user} SMS grátis!`
        });
      }
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep !== 4 || !canProceed) return;

    // Validar telefone obrigatório
    const phoneResult = normalizeInternationalPhone(formData.phone, selectedCountry);
    if (!formData.phone || !phoneResult.ok) {
      toast({
        title: "Telefone obrigatório",
        description: phoneResult.reason || "Por favor, insira um número de telefone válido.",
        variant: "destructive"
      });
      return;
    }

    // Se OTP estiver habilitado, solicitar verificação
    if (settings.otp_enabled) {
      setRegistrationData({
        ...formData,
        phone: formData.phone
      });
      setShowOtpModal(true);
      return;
    }
    
    await createAccount();
  };

  const handlePhoneVerified = () => {
    createAccount();
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const progressPercentage = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">Dados Pessoais</h3>
              <p className="text-muted-foreground">Vamos começar com suas informações básicas</p>
            </div>

            <div className="space-y-5">
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium text-foreground">Nome Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  className="modern-input mt-2"
                />
              </div>

              <div>
                <Label htmlFor="company" className="text-sm font-medium text-foreground">Empresa (Opcional)</Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="Nome da sua empresa"
                  value={formData.company}
                  onChange={(e) => updateFormData('company', e.target.value)}
                  className="modern-input mt-2"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">Informações de Contato</h3>
              <p className="text-muted-foreground">Como podemos entrar em contato com você</p>
            </div>

            <div className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-foreground">E-mail Profissional</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className="modern-input mt-2"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground">Telefone/WhatsApp</Label>
                <div className="flex gap-3 mt-2">
                  <Select value={formData.countryCode} onValueChange={(value) => updateFormData('countryCode', value)}>
                    <SelectTrigger className="w-32 modern-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map((item) => (
                        <SelectItem key={item.code} value={item.code}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs opacity-60">{item.country}</span>
                            <span>{item.code}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    placeholder="934 736 823"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className="modern-input flex-1"
                  />
                </div>
                {formData.phone.length >= 9 && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    Número válido (Angola)
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">Segurança da Conta</h3>
              <p className="text-muted-foreground">Crie uma senha forte para proteger sua conta</p>
            </div>

            <div className="space-y-5">
              <div>
                <Label htmlFor="password" className="text-sm font-medium text-foreground">Senha Segura</Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    className="modern-input pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                
                {formData.password && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Força da senha:</span>
                      <span className={`font-medium ${passwordStrength.level === 'Forte' ? 'text-green-600' : passwordStrength.level === 'Boa' ? 'text-blue-600' : passwordStrength.level === 'Regular' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {passwordStrength.level}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.percentage}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        {formData.password.length >= 8 ? 
                          <Check className="w-3 h-3 text-green-600" /> : 
                          <X className="w-3 h-3 text-red-600" />
                        }
                        <span className={formData.password.length >= 8 ? 'text-green-600' : 'text-red-600'}>
                          8+ caracteres
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {/[A-Z]/.test(formData.password) ? 
                          <Check className="w-3 h-3 text-green-600" /> : 
                          <X className="w-3 h-3 text-red-600" />
                        }
                        <span className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-red-600'}>
                          Maiúscula
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {/\d/.test(formData.password) ? 
                          <Check className="w-3 h-3 text-green-600" /> : 
                          <X className="w-3 h-3 text-red-600" />
                        }
                        <span className={/\d/.test(formData.password) ? 'text-green-600' : 'text-red-600'}>
                          Número ou símbolo
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">Confirmar Senha</Label>
                <div className="relative mt-2">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                    className="modern-input pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                
                {formData.confirmPassword && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Senhas coincidem</span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-red-600" />
                        <span className="text-red-600">Senhas não coincidem</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/20 mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">Finalizar Cadastro</h3>
              <p className="text-muted-foreground">Revise suas informações e aceite os termos</p>
            </div>

            <div className="space-y-6">
              <div className="bg-muted/50 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Nome:</span>
                  <span className="font-medium">{formData.fullName}</span>
                </div>
                {formData.company && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Empresa:</span>
                    <span className="font-medium">{formData.company}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">E-mail:</span>
                  <span className="font-medium">{formData.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Telefone:</span>
                  <span className="font-medium">{formData.countryCode} {formData.phone}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => updateFormData('acceptTerms', !!checked)}
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed text-muted-foreground">
                  Eu aceito os <a href="/legal/terms" className="text-primary hover:underline">Termos de Uso</a> e{' '}
                  <a href="/legal/privacy" className="text-primary hover:underline">Política de Privacidade</a> da SMS.AO
                </Label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Card className="w-full max-w-md mx-auto glass-card border-0 shadow-modern">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-lg font-medium">Marketing Premium</span>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso do Cadastro</span>
              <span className="text-primary font-medium">{Math.round(progressPercentage)}% completo</span>
            </div>
            
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const completed = isCompleted(step.id);
                const current = step.id === currentStep;
                
                return (
                  <div key={step.id} className="flex flex-col items-center gap-2">
                    <div className={`
                      flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                      ${completed ? 'bg-primary text-primary-foreground' : 
                        current ? 'bg-primary/20 text-primary border-2 border-primary' : 
                        'bg-muted text-muted-foreground'}
                    `}>
                      {completed && !current ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${current ? 'text-primary' : 'text-muted-foreground'}`}>
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderStepContent()}

            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Anterior
                </Button>
              )}
              
              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed}
                  className={`${currentStep === 1 ? 'w-full' : 'flex-1'} signup-button`}
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!canProceed || isLoading}
                  className="w-full signup-button"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Criando conta...
                    </>
                  ) : (
                    <>
                      Criar minha conta premium
                      <Zap className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {showOtpModal && registrationData && (
        <OTPRegistrationModal
          open={showOtpModal}
          onOpenChange={setShowOtpModal}
          phone={registrationData.phone}
          onVerified={handlePhoneVerified}
        />
      )}
    </>
  );
};

export default ModernSignupForm;