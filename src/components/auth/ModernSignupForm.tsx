import React, { useState, useEffect } from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { IconBrandGoogle, IconBrandGithub } from "@tabler/icons-react";
import { Link, useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, ArrowRight, Zap } from "lucide-react";
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

// Enhanced Input Component
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "modern-input",
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
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
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

export const ModernSignupForm = () => {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings } = useRegistrationSettings();
  
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

  const { errors, isValid, validateField, getPasswordStrength } = useFormValidation(registerSchema, formData);

  // Redirect if already logged in
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

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
        return "text-green-500";
      case "Muito forte":
        return "text-green-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getPasswordStrengthWidth = () => {
    const strength = getPasswordStrength(formData.password);
    return `${strength.percentage}%`;
  };

  const passwordStrengthTips = [
    { text: "8+ caracteres", met: formData.password.length >= 8 },
    { text: "Maiúscula", met: /[A-Z]/.test(formData.password) },
    { text: "Minúscula", met: /[a-z]/.test(formData.password) },
    { text: "Número", met: /\d/.test(formData.password) },
  ];

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
      const { error } = await signUp(formData.email, formData.password, formData.fullName);
      
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
    createAccount();
  };

  return (
    <div className="max-w-lg w-full mx-auto rounded-2xl md:rounded-3xl p-6 md:p-10 glass-card backdrop-blur-xl border border-white/10 shadow-elegant">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 rounded-2xl bg-gradient-primary shadow-glow mb-4">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <h2 className="font-bold text-2xl text-foreground mb-2">
          Bem-vindo ao SMS.AO
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Crie sua conta e comece a enviar campanhas de SMS profissionais em Angola
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-4">
          <LabelInputContainer>
            <div className="relative">
              <Input
                id="fullname"
                placeholder={focusedField === "fullname" ? "" : "João Silva"}
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                onFocus={() => setFocusedField("fullname")}
                onBlur={() => setFocusedField(null)}
                className={`modern-input ${errors.fullName ? "border-red-500" : ""}`}
              />
              <Label 
                htmlFor="fullname" 
                className={`input-label ${focusedField === "fullname" || formData.fullName ? "floating-label" : ""}`}
              >
                Nome Completo
              </Label>
            </div>
            {errors.fullName && <p className="text-red-500 text-xs mt-1 animate-slide-in">{errors.fullName}</p>}
          </LabelInputContainer>
          
          <LabelInputContainer>
            <div className="relative">
              <Input
                id="company"
                placeholder={focusedField === "company" ? "" : "Minha Empresa Lda."}
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                onFocus={() => setFocusedField("company")}
                onBlur={() => setFocusedField(null)}
                className={`modern-input ${errors.company ? "border-red-500" : ""}`}
              />
              <Label 
                htmlFor="company" 
                className={`input-label ${focusedField === "company" || formData.company ? "floating-label" : ""}`}
              >
                Empresa
              </Label>
            </div>
            {errors.company && <p className="text-red-500 text-xs mt-1 animate-slide-in">{errors.company}</p>}
          </LabelInputContainer>
        </div>

        <LabelInputContainer>
          <div className="relative">
            <Input
              id="email"
              placeholder={focusedField === "email" ? "" : "joao@empresa.ao"}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              className={`modern-input ${errors.email ? "border-red-500" : ""}`}
            />
            <Label 
              htmlFor="email" 
              className={`input-label ${focusedField === "email" || formData.email ? "floating-label" : ""}`}
            >
              E-mail
            </Label>
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1 animate-slide-in">{errors.email}</p>}
        </LabelInputContainer>

        <LabelInputContainer>
          <div className="relative">
            <InternationalPhoneInput
              value={formData.phone}
              onChange={(value) => setFormData({ ...formData, phone: value })}
              className={`modern-input ${errors.phone ? "border-red-500" : ""}`}
            />
            <Label 
              htmlFor="phone" 
              className={`input-label ${focusedField === "phone" || formData.phone ? "floating-label" : ""}`}
            >
              Telefone
            </Label>
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1 animate-slide-in">{errors.phone}</p>}
        </LabelInputContainer>

        <div className="grid md:grid-cols-2 gap-4">
          <LabelInputContainer>
            <div className="relative">
              <Input
                id="password"
                placeholder={focusedField === "password" ? "" : "••••••••"}
                type={showPassword.password ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                className={`modern-input pr-12 ${errors.password ? "border-red-500" : ""}`}
              />
              <Label 
                htmlFor="password" 
                className={`input-label ${focusedField === "password" || formData.password ? "floating-label" : ""}`}
              >
                Senha
              </Label>
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, password: !showPassword.password })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword.password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1 animate-slide-in">{errors.password}</p>}
          </LabelInputContainer>
          
          <LabelInputContainer>
            <div className="relative">
              <Input
                id="confirmpassword"
                placeholder={focusedField === "confirmpassword" ? "" : "••••••••"}
                type={showPassword.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                onFocus={() => setFocusedField("confirmpassword")}
                onBlur={() => setFocusedField(null)}
                className={`modern-input pr-12 ${errors.confirmPassword ? "border-red-500" : ""}`}
              />
              <Label 
                htmlFor="confirmpassword" 
                className={`input-label ${focusedField === "confirmpassword" || formData.confirmPassword ? "floating-label" : ""}`}
              >
                Confirmar Senha
              </Label>
              <button
                type="button"
                onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 animate-slide-in">{errors.confirmPassword}</p>}
          </LabelInputContainer>
        </div>

        {/* Enhanced Password Strength Indicator */}
        {formData.password && (
          <div className="bg-muted/30 rounded-xl p-4 border border-muted animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Força da senha:</span>
              <span className={`text-sm font-semibold ${getPasswordStrengthColor()}`}>
                {getPasswordStrength(formData.password).level}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mb-3">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ease-out ${getPasswordStrengthColor().replace('text-', 'bg-')}`}
                style={{ width: getPasswordStrengthWidth() }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {passwordStrengthTips.map((tip, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${tip.met ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                  <span className={`text-xs transition-colors duration-300 ${tip.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {tip.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-3 p-4 rounded-xl border border-muted bg-muted/20">
          <Checkbox
            id="terms"
            checked={formData.acceptTerms}
            onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: Boolean(checked) })}
            className="rounded-lg"
          />
          <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
            Aceito os{" "}
            <Link to="/legal/terms" className="text-primary hover:underline font-medium">
              termos de uso
            </Link>{" "}
            e{" "}
            <Link to="/legal/privacy" className="text-primary hover:underline font-medium">
              política de privacidade
            </Link>
          </label>
        </div>

        <button
          className="relative group w-full bg-gradient-primary text-white rounded-xl h-12 font-semibold 
                   shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-[1.02] 
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                   overflow-hidden"
          type="submit"
          disabled={isLoading}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Criando conta...
              </>
            ) : (
              <>
                Criar conta
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                        translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground font-medium">Ou continue com</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            className="relative group flex items-center justify-center gap-2 px-4 h-11 
                     border border-input rounded-xl bg-background hover:bg-muted/50 
                     transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
            type="button"
          >
            <IconBrandGoogle className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Google
            </span>
          </button>
          <button
            className="relative group flex items-center justify-center gap-2 px-4 h-11 
                     border border-input rounded-xl bg-background hover:bg-muted/50 
                     transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
            type="button"
          >
            <IconBrandGithub className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              GitHub
            </span>
          </button>
        </div>
      </form>

      <div className="text-center space-y-3 mt-8">
        <p className="text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link 
            to="/login" 
            className="text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
          >
            Faça login
          </Link>
        </p>

        <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-sm mx-auto">
          Ao criar uma conta, você aceita nossos{" "}
          <Link 
            to="/legal/terms" 
            className="text-primary hover:text-primary/80 transition-colors hover:underline"
          >
            Termos de Uso
          </Link>{" "}
          e{" "}
          <Link 
            to="/legal/privacy" 
            className="text-primary hover:text-primary/80 transition-colors hover:underline"
          >
            Política de Privacidade
          </Link>
        </p>
      </div>

      {/* OTP Modal */}
      <OTPRegistrationModal
        open={showOtpModal}
        onOpenChange={setShowOtpModal}
        phone={formData.phone}
        onVerified={handlePhoneVerified}
      />
    </div>
  );
};