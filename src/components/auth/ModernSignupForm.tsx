import React, { useState, useEffect } from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { IconBrandGoogle, IconBrandGithub } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, ArrowRight, Zap, CheckCircle, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { InternationalPhoneInput } from "@/components/shared/InternationalPhoneInput";
import { useFormValidation, registerSchema } from "@/hooks/useFormValidation";
import { useRegistrationSettings } from "@/hooks/useRegistrationSettings";
import OTPRegistrationModal from "@/components/auth/OTPRegistrationModal";
import { normalizeInternationalPhone, DEFAULT_COUNTRY, type PhoneCountry } from "@/lib/internationalPhoneNormalization";

// Premium Label Component
const labelVariants = cva("text-sm font-semibold tracking-wide leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-all duration-300");
const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>>(({
  className,
  ...props
}, ref) => <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />);
Label.displayName = LabelPrimitive.Root.displayName;

// Premium Input Component
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  className,
  type,
  ...props
}, ref) => {
  return <input type={type} className={cn("modern-input", className)} ref={ref} {...props} />;
});
Input.displayName = "Input";

// Enhanced Label Input Container
const LabelInputContainer = ({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={cn("flex flex-col space-y-3 w-full", className)}>
      {children}
    </div>;
};

// Premium Progress Step Component
const ProgressStep = ({
  step,
  currentStep,
  title,
  isCompleted
}: {
  step: number;
  currentStep: number;
  title: string;
  isCompleted?: boolean;
}) => {
  const isActive = step === currentStep;
  const isPassed = step < currentStep || isCompleted;
  return <div className="flex items-center space-x-3">
      <div className={cn("relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 ease-out", isPassed ? "bg-gradient-primary text-white shadow-glow scale-110" : isActive ? "bg-primary/20 text-primary border-2 border-primary scale-105" : "bg-muted text-muted-foreground border border-muted")}>
        {isPassed ? <CheckCircle className="w-4 h-4" /> : isActive ? <Clock className="w-4 h-4" /> : <span className="text-xs font-bold">{step}</span>}
      </div>
      <span className={cn("text-sm font-medium transition-colors duration-300", isPassed ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground")}>
        {title}
      </span>
    </div>;
};
export const ModernSignupForm = () => {
  const {
    signUp
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const {
    settings
  } = useRegistrationSettings();
  const [formData, setFormData] = useState({
    fullName: "",
    company: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false
  });
  const [selectedCountry, setSelectedCountry] = useState<PhoneCountry>(DEFAULT_COUNTRY);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const {
    errors,
    isValid,
    validateField,
    getPasswordStrength
  } = useFormValidation(registerSchema, formData);

  // Redirect if already logged in
  const {
    user,
    loading
  } = useAuth();
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  // Progressive form step calculation
  useEffect(() => {
    let step = 1;
    if (formData.fullName && formData.email) step = 2;
    if (formData.fullName && formData.email && formData.phone) step = 3;
    if (formData.fullName && formData.email && formData.phone && formData.password) step = 4;
    setCurrentStep(step);
  }, [formData]);
  const getPasswordStrengthColor = () => {
    const strength = getPasswordStrength(formData.password);
    switch (strength.level) {
      case "Muito fraca":
        return "text-red-500";
      case "Fraca":
        return "text-orange-500";
      case "Média":
        return "text-yellow-500";
      case "Forte":
        return "text-emerald-500";
      case "Muito forte":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };
  const getPasswordStrengthWidth = () => {
    const strength = getPasswordStrength(formData.password);
    return `${strength.percentage}%`;
  };
  const getProgressPercentage = () => {
    let completed = 0;
    const fields = ['fullName', 'email', 'phone', 'password', 'confirmPassword'];
    fields.forEach(field => {
      if (formData[field as keyof typeof formData]) completed++;
    });
    return completed / fields.length * 100;
  };
  const passwordStrengthTips = [{
    text: "8+ caracteres",
    met: formData.password.length >= 8
  }, {
    text: "Maiúscula",
    met: /[A-Z]/.test(formData.password)
  }, {
    text: "Minúscula",
    met: /[a-z]/.test(formData.password)
  }, {
    text: "Número ou símbolo",
    met: /[\d\W]/.test(formData.password)
  }];
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro de validação",
        description: "As senhas não coincidem. Verifique e tente novamente.",
        variant: "destructive"
      });
      return;
    }
    if (!formData.acceptTerms) {
      toast({
        title: "Aceite os termos",
        description: "É necessário aceitar os termos de uso para continuar.",
        variant: "destructive"
      });
      return;
    }

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
  const createAccount = async () => {
    setIsLoading(true);
    try {
      const {
        error
      } = await signUp(formData.email, formData.password, formData.fullName);
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
  const handlePhoneVerified = () => {
    createAccount();
  };
  return <div className="max-w-2xl w-full mx-auto">
      {/* Premium Progress Indicator */}
      <div className="mb-8 bg-background/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30 shadow-elegant">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Progresso do Cadastro</h3>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span>{Math.round(getProgressPercentage())}% completo</span>
          </div>
        </div>
        
        <div className="w-full bg-muted/50 rounded-full h-2 mb-6 overflow-hidden">
          <div className="h-full bg-gradient-primary rounded-full transition-all duration-700 ease-out shadow-glow" style={{
          width: `${getProgressPercentage()}%`
        }} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ProgressStep step={1} currentStep={currentStep} title="Dados Pessoais" />
          <ProgressStep step={2} currentStep={currentStep} title="Contato" />
          <ProgressStep step={3} currentStep={currentStep} title="Segurança" />
          <ProgressStep step={4} currentStep={currentStep} title="Finalização" />
        </div>
      </div>

      {/* Premium Form Container */}
      <div className="bg-background/80 backdrop-blur-2xl rounded-3xl p-8 md:p-12 border border-border/20 shadow-premium relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-glass opacity-30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl" />
        
        <div className="relative z-10">
          {/* Premium Header */}
          <div className="text-center mb-10">
            <div className="inline-flex p-4 rounded-3xl bg-gradient-primary shadow-premium mb-6 group">
              <Zap className="h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
            </div>
            
            <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto leading-relaxed">
              Crie sua conta e transforme sua comunicação empresarial com nossa plataforma premium de SMS
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Step 1: Personal Info */}
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <LabelInputContainer>
                  <div className="input-container">
                    <Input id="fullname" placeholder="" type="text" value={formData.fullName} onChange={e => setFormData({
                    ...formData,
                    fullName: e.target.value
                  })} onFocus={() => setFocusedField("fullname")} onBlur={() => setFocusedField(null)} className={errors.fullName ? "border-red-500/50 focus:border-red-500" : ""} />
                    <Label htmlFor="fullname" className={`input-label ${focusedField === "fullname" || formData.fullName ? "floating-label" : ""}`}>
                      Nome Completo
                    </Label>
                  </div>
                  {errors.fullName && <p className="text-red-500 text-xs mt-2 animate-slide-in flex items-center space-x-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full" />
                      <span>{errors.fullName}</span>
                    </p>}
                </LabelInputContainer>
                
                <LabelInputContainer>
                  <div className="input-container">
                    <Input id="company" placeholder="" type="text" value={formData.company} onChange={e => setFormData({
                    ...formData,
                    company: e.target.value
                  })} onFocus={() => setFocusedField("company")} onBlur={() => setFocusedField(null)} className={errors.company ? "border-red-500/50 focus:border-red-500" : ""} />
                    <Label htmlFor="company" className={`input-label ${focusedField === "company" || formData.company ? "floating-label" : ""}`}>
                      Empresa (Opcional)
                    </Label>
                  </div>
                  {errors.company && <p className="text-red-500 text-xs mt-2 animate-slide-in flex items-center space-x-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full" />
                      <span>{errors.company}</span>
                    </p>}
                </LabelInputContainer>
              </div>

              <LabelInputContainer>
                <div className="input-container">
                  <Input id="email" placeholder="" type="email" value={formData.email} onChange={e => setFormData({
                  ...formData,
                  email: e.target.value
                })} onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)} className={errors.email ? "border-red-500/50 focus:border-red-500" : ""} />
                  <Label htmlFor="email" className={`input-label ${focusedField === "email" || formData.email ? "floating-label" : ""}`}>
                    E-mail Profissional
                  </Label>
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-2 animate-slide-in flex items-center space-x-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full" />
                    <span>{errors.email}</span>
                  </p>}
              </LabelInputContainer>

              <LabelInputContainer>
                <div className="input-container">
                  <InternationalPhoneInput value={formData.phone} onChange={value => setFormData({
                  ...formData,
                  phone: value
                })} className={`modern-input ${errors.phone ? "border-red-500/50 focus:border-red-500" : ""}`} onFocus={() => setFocusedField("phone")} onBlur={() => setFocusedField(null)} />
                  <Label htmlFor="phone" className={`input-label ${focusedField === "phone" || formData.phone ? "floating-label" : ""}`}>
                    Telefone/WhatsApp
                  </Label>
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-2 animate-slide-in flex items-center space-x-1">
                    <span className="w-1 h-1 bg-red-500 rounded-full" />
                    <span>{errors.phone}</span>
                  </p>}
              </LabelInputContainer>
            </div>

            {/* Step 2: Security */}
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <LabelInputContainer>
                  <div className="input-container">
                    <Input id="password" placeholder="" type={showPassword.password ? "text" : "password"} value={formData.password} onChange={e => setFormData({
                    ...formData,
                    password: e.target.value
                  })} onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)} className={`pr-14 ${errors.password ? "border-red-500/50 focus:border-red-500" : ""}`} />
                    <Label htmlFor="password" className={`input-label ${focusedField === "password" || formData.password ? "floating-label" : ""}`}>
                      Senha Segura
                    </Label>
                    <button type="button" onClick={() => setShowPassword({
                    ...showPassword,
                    password: !showPassword.password
                  })} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110">
                      {showPassword.password ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-2 animate-slide-in flex items-center space-x-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full" />
                      <span>{errors.password}</span>
                    </p>}
                </LabelInputContainer>
                
                <LabelInputContainer>
                  <div className="input-container">
                    <Input id="confirmpassword" placeholder="" type={showPassword.confirm ? "text" : "password"} value={formData.confirmPassword} onChange={e => setFormData({
                    ...formData,
                    confirmPassword: e.target.value
                  })} onFocus={() => setFocusedField("confirmpassword")} onBlur={() => setFocusedField(null)} className={`pr-14 ${errors.confirmPassword ? "border-red-500/50 focus:border-red-500" : ""}`} />
                    <Label htmlFor="confirmpassword" className={`input-label ${focusedField === "confirmpassword" || formData.confirmPassword ? "floating-label" : ""}`}>
                      Confirmar Senha
                    </Label>
                    <button type="button" onClick={() => setShowPassword({
                    ...showPassword,
                    confirm: !showPassword.confirm
                  })} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110">
                      {showPassword.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-2 animate-slide-in flex items-center space-x-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full" />
                      <span>{errors.confirmPassword}</span>
                    </p>}
                </LabelInputContainer>
              </div>

              {/* Premium Password Strength Indicator */}
              {formData.password && <div className="bg-muted/20 backdrop-blur-xl rounded-2xl p-6 border border-border/30 animate-scale-in">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-foreground">Força da senha:</span>
                    <span className={`text-sm font-bold ${getPasswordStrengthColor()}`}>
                      {getPasswordStrength(formData.password).level}
                    </span>
                  </div>
                  <div className="w-full bg-muted/50 rounded-full h-3 mb-4 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ease-out ${getPasswordStrengthColor().replace('text-', 'bg-')} shadow-glow`} style={{
                  width: getPasswordStrengthWidth()
                }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {passwordStrengthTips.map((tip, index) => <div key={index} className="flex items-center space-x-3">
                        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${tip.met ? 'bg-emerald-500 shadow-glow scale-110' : 'bg-muted-foreground/40'}`} />
                        <span className={`text-xs font-medium transition-colors duration-500 ${tip.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                          {tip.text}
                        </span>
                      </div>)}
                  </div>
                </div>}
            </div>

            {/* Terms Acceptance */}
            <div className="flex items-start space-x-4 p-6 rounded-2xl border border-border/30 bg-muted/10 backdrop-blur-xl">
              <Checkbox id="terms" checked={formData.acceptTerms} onCheckedChange={checked => setFormData({
              ...formData,
              acceptTerms: Boolean(checked)
            })} className="rounded-lg mt-1 data-[state=checked]:bg-gradient-primary" />
              <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer font-medium">
                Eu aceito os{" "}
                <Link to="/legal/terms" className="text-primary hover:text-primary/80 transition-colors hover:underline font-semibold">
                  Termos de Uso
                </Link>{" "}
                e{" "}
                <Link to="/legal/privacy" className="text-primary hover:text-primary/80 transition-colors hover:underline font-semibold">
                  Política de Privacidade
                </Link>{" "}
                da SMS.AO
              </label>
            </div>

            {/* Premium Submit Button */}
            <button className="relative group w-full bg-gradient-primary text-white rounded-2xl h-14 font-bold text-base
                       shadow-premium hover:shadow-glow transition-all duration-500 hover:scale-[1.02] 
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                       overflow-hidden border border-white/10" type="submit" disabled={isLoading}>
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isLoading ? <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Criando sua conta...</span>
                  </> : <>
                    <span>Criar minha conta premium</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </>}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                            translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </button>

            {/* Premium Social Login */}
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/30" />
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-background/80 backdrop-blur-xl px-4 py-2 text-muted-foreground font-semibold tracking-wider rounded-full border border-border/20">
                  Ou continue com
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="relative group flex items-center justify-center gap-3 px-6 h-12 
                         border border-border/30 rounded-2xl bg-background/50 backdrop-blur-xl hover:bg-muted/30 
                         transition-all duration-400 hover:scale-[1.02] hover:shadow-modern" type="button">
                <IconBrandGoogle className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
                <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  Google
                </span>
              </button>
              <button className="relative group flex items-center justify-center gap-3 px-6 h-12 
                         border border-border/30 rounded-2xl bg-background/50 backdrop-blur-xl hover:bg-muted/30 
                         transition-all duration-400 hover:scale-[1.02] hover:shadow-modern" type="button">
                <IconBrandGithub className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors duration-300" />
                <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  GitHub
                </span>
              </button>
            </div>
          </form>

          {/* Premium Footer */}
          <div className="text-center space-y-4 mt-10 pt-8 border-t border-border/20">
            <p className="text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-primary hover:text-primary/80 font-semibold transition-all duration-300 hover:underline">
                Entre aqui
              </Link>
            </p>

            <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-lg mx-auto">
              Ao criar uma conta, você aceita nossos{" "}
              <Link to="/legal/terms" className="text-primary hover:text-primary/80 transition-colors duration-300 hover:underline font-medium">
                Termos de Uso
              </Link>{" "}
              e{" "}
              <Link to="/legal/privacy" className="text-primary hover:text-primary/80 transition-colors duration-300 hover:underline font-medium">
                Política de Privacidade
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* OTP Modal */}
      <OTPRegistrationModal open={showOtpModal} onOpenChange={setShowOtpModal} phone={formData.phone} onVerified={handlePhoneVerified} />
    </div>;
};