import React, { useState, useEffect } from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { IconBrandGoogle, IconBrandGithub, IconLock, IconMail, IconUser, IconBuilding, IconPhone } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { InternationalPhoneInput } from "@/components/shared/InternationalPhoneInput";
import { useFormValidation, registerSchema } from "@/hooks/useFormValidation";
import { useRegistrationSettings } from "@/hooks/useRegistrationSettings";
import OTPRegistrationModal from "@/components/auth/OTPRegistrationModal";
import { normalizeInternationalPhone, DEFAULT_COUNTRY, type PhoneCountry } from "@/lib/internationalPhoneNormalization";

// Label Component
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

// Input Component
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "modern-input flex h-12 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// Bottom Gradient Component
const BottomGradient = () => {
  return (
    <>
      <span className="bottom-gradient" />
      <span className="bottom-gradient-blur" />
    </>
  );
};

// Label Input Container
const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};

export function ModernSignupForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    company: "",
    phone: "",
    acceptTerms: false
  });
  const [selectedCountry, setSelectedCountry] = useState<PhoneCountry>(DEFAULT_COUNTRY);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  
  const navigate = useNavigate();
  const { signUp, user, loading } = useAuth();
  const { toast } = useToast();
  const { settings } = useRegistrationSettings();
  const { errors, isValid, validateField, getPasswordStrength } = useFormValidation(registerSchema, {
    fullName: `${formData.firstName} ${formData.lastName}`.trim(),
    email: formData.email,
    password: formData.password,
    confirmPassword: formData.confirmPassword,
    company: formData.company,
    phone: formData.phone,
    acceptTerms: formData.acceptTerms
  });

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (!formData.acceptTerms) {
      toast({
        title: "Erro",
        description: "Você deve aceitar os termos de uso",
        variant: "destructive",
      });
      return;
    }

    // Validar telefone obrigatório
    const phoneResult = normalizeInternationalPhone(formData.phone, selectedCountry);
    if (!formData.phone || !phoneResult.ok) {
      toast({
        title: "Telefone obrigatório",
        description: phoneResult.reason || "Por favor, insira um número de telefone válido",
        variant: "destructive",
      });
      return;
    }

    // Se OTP estiver habilitado e telefone não verificado, solicitar verificação
    if (settings.otp_enabled && !phoneVerified) {
      setShowOTPModal(true);
      return;
    }

    await createAccount();
  };

  const createAccount = async () => {
    setIsLoading(true);

    try {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const { error } = await signUp(formData.email, formData.password, fullName);
      
      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Conta criada com sucesso! 🎉",
          description: `Bem-vindo à plataforma SMS.AO. Você ganhou ${settings.free_credits_new_user} SMS grátis!`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneVerified = () => {
    setPhoneVerified(true);
    createAccount();
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      <div className="max-w-md w-full mx-auto rounded-2xl p-6 md:p-8 bg-card border border-border shadow-elevated">
        <h2 className="font-bold text-2xl text-foreground mb-2">
          Seja Bem-vindo(a) ao SMS AO
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm mb-8">
          Crie sua conta e comece a enviar SMS para Angola com {settings.free_credits_new_user} créditos grátis
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <LabelInputContainer>
              <Label htmlFor="firstName" className="flex items-center gap-2">
                <IconUser className="h-4 w-4" />
                Nome
              </Label>
              <Input 
                id="firstName" 
                placeholder="João" 
                type="text" 
                value={formData.firstName}
                onChange={(e) => {
                  updateFormData('firstName', e.target.value);
                  validateField('fullName', `${e.target.value} ${formData.lastName}`.trim());
                }}
                required
              />
            </LabelInputContainer>
            <LabelInputContainer>
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input 
                id="lastName" 
                placeholder="Santos" 
                type="text" 
                value={formData.lastName}
                onChange={(e) => {
                  updateFormData('lastName', e.target.value);
                  validateField('fullName', `${formData.firstName} ${e.target.value}`.trim());
                }}
                required
              />
            </LabelInputContainer>
          </div>

          <LabelInputContainer>
            <Label htmlFor="email" className="flex items-center gap-2">
              <IconMail className="h-4 w-4" />
              Email
            </Label>
            <Input 
              id="email" 
              placeholder="joao@empresa.ao" 
              type="email"
              value={formData.email}
              onChange={(e) => {
                updateFormData('email', e.target.value);
                validateField('email', e.target.value);
              }}
              required
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </LabelInputContainer>

          <LabelInputContainer>
            <Label htmlFor="company" className="flex items-center gap-2">
              <IconBuilding className="h-4 w-4" />
              Empresa (Opcional)
            </Label>
            <Input 
              id="company" 
              placeholder="Nome da sua empresa" 
              type="text"
              value={formData.company}
              onChange={(e) => updateFormData('company', e.target.value)}
            />
          </LabelInputContainer>

          <LabelInputContainer>
            <Label htmlFor="phone" className="flex items-center gap-2">
              <IconPhone className="h-4 w-4" />
              Telefone *
            </Label>
            <InternationalPhoneInput
              value={formData.phone}
              onChange={(value) => updateFormData('phone', value)}
              country={selectedCountry}
              onCountryChange={setSelectedCountry}
              showValidation={true}
              autoDetectCountry={true}
              className="h-12 rounded-xl"
              placeholder="Digite seu número"
            />
            {formData.phone && !normalizeInternationalPhone(formData.phone, selectedCountry).ok && (
              <p className="text-sm text-destructive">
                {normalizeInternationalPhone(formData.phone, selectedCountry).reason}
              </p>
            )}
            {phoneVerified && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <Check className="h-4 w-4" />
                Telefone verificado
              </p>
            )}
          </LabelInputContainer>

          <LabelInputContainer>
            <Label htmlFor="password" className="flex items-center gap-2">
              <IconLock className="h-4 w-4" />
              Senha
            </Label>
            <div className="relative">
              <Input 
                id="password" 
                placeholder="••••••••" 
                type={showPassword.password ? "text" : "password"}
                value={formData.password}
                onChange={(e) => {
                  updateFormData('password', e.target.value);
                  validateField('password', e.target.value);
                }}
                className="pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword({...showPassword, password: !showPassword.password})}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword.password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Força da senha:</span>
                  <span className={`font-medium ${
                    getPasswordStrength(formData.password).color === 'destructive' ? 'text-destructive' :
                    getPasswordStrength(formData.password).color === 'orange' ? 'text-orange-500' :
                    getPasswordStrength(formData.password).color === 'yellow' ? 'text-yellow-500' :
                    getPasswordStrength(formData.password).color === 'primary' ? 'text-primary' :
                    'text-green-500'
                  }`}>
                    {getPasswordStrength(formData.password).level}
                  </span>
                </div>
                <Progress 
                  value={getPasswordStrength(formData.password).percentage} 
                  className="h-2"
                />
                {getPasswordStrength(formData.password).feedback.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {getPasswordStrength(formData.password).feedback.map((tip, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-muted-foreground rounded-full flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </LabelInputContainer>

          <LabelInputContainer>
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <div className="relative">
              <Input 
                id="confirmPassword" 
                placeholder="••••••••" 
                type={showPassword.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => {
                  updateFormData('confirmPassword', e.target.value);
                  validateField('confirmPassword', e.target.value);
                }}
                className="pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </LabelInputContainer>

          <div className="flex items-center space-x-3 p-4 rounded-xl border border-border bg-muted/30">
            <Checkbox
              id="terms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked) => updateFormData('acceptTerms', checked)}
              className="rounded-lg"
            />
            <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              Aceito os{" "}
              <Link to="/terms" className="text-primary hover:underline font-medium">
                termos de uso
              </Link>{" "}
              e{" "}
              <Link to="/privacy" className="text-primary hover:underline font-medium">
                política de privacidade
              </Link>
            </label>
          </div>

          <button
            className="signup-button group/btn relative block w-full text-white rounded-xl h-12 font-medium transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={isLoading || !isValid || !formData.phone || !normalizeInternationalPhone(formData.phone, selectedCountry).ok}
          >
            {isLoading ? "Criando conta..." : settings.otp_enabled && !phoneVerified ? "Verificar Telefone" : "Criar Conta Grátis →"}
            <BottomGradient />
          </button>

          <div className="bg-gradient-to-r from-transparent via-border to-transparent my-8 h-[1px] w-full" />

          <div className="flex flex-col space-y-4">
            <button
              className="relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-black rounded-xl h-12 font-medium bg-secondary hover:bg-secondary/80 dark:bg-card dark:text-white border border-border transition-all duration-300"
              type="button"
              disabled
            >
              <IconBrandGoogle className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">
                Google (Em breve)
              </span>
              <BottomGradient />
            </button>
            <button
              className="relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-black rounded-xl h-12 font-medium bg-secondary hover:bg-secondary/80 dark:bg-card dark:text-white border border-border transition-all duration-300"
              type="button"
              disabled
            >
              <IconBrandGithub className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">
                GitHub (Em breve)
              </span>
              <BottomGradient />
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <span className="text-muted-foreground">Já tem uma conta? </span>
          <Link 
            to="/login" 
            className="text-primary hover:underline font-medium transition-all duration-300"
          >
            Fazer login
          </Link>
        </div>
      </div>

      {/* OTP Modal */}
      <OTPRegistrationModal
        open={showOTPModal}
        onOpenChange={setShowOTPModal}
        phone={formData.phone}
        onVerified={handlePhoneVerified}
      />
    </>
  );
}