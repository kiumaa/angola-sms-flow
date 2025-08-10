import { useState, useEffect } from 'react';
import { z } from 'zod';

// Schema de validação para login
export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email é obrigatório')
    .email('Formato de email inválido'),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
});

// Schema de validação para registro
export const registerSchema = z.object({
  fullName: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  email: z.string()
    .min(1, 'Email é obrigatório')
    .email('Formato de email inválido'),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha muito longa'),
  confirmPassword: z.string(),
  company: z.string().optional(),
  phone: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Você deve aceitar os termos de uso'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

// Schema para validação de telefone angolano
export const phoneSchema = z.string()
  .regex(/^9\d{8}$/, 'Número deve começar com 9 e ter 9 dígitos')
  .transform(phone => `+244${phone}`);

type ValidationSchema = typeof loginSchema | typeof registerSchema;

export const useFormValidation = <T extends Record<string, any>>(
  schema: ValidationSchema,
  formData: T
) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const result = schema.safeParse(formData);
    
    if (result.success) {
      setErrors({});
      setIsValid(true);
    } else {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        const path = error.path.join('.');
        newErrors[path] = error.message;
      });
      setErrors(newErrors);
      setIsValid(false);
    }
  }, [formData, schema]);

  const validateField = (fieldName: string, value: any) => {
    try {
      const fieldSchema = (schema as any).shape[fieldName];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setErrors(prev => ({ ...prev, [fieldName]: '' }));
        return true;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [fieldName]: error.errors[0]?.message || 'Erro de validação' }));
      }
      return false;
    }
    return true;
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    let feedback: string[] = [];

    if (password.length >= 8) {
      strength += 1;
    } else {
      feedback.push('Pelo menos 8 caracteres');
    }

    if (/[A-Z]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('Uma letra maiúscula');
    }

    if (/[a-z]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('Uma letra minúscula');
    }

    if (/\d/.test(password)) {
      strength += 1;
    } else {
      feedback.push('Um número');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength += 1;
    } else {
      feedback.push('Um caractere especial');
    }

    const levels = ['Muito fraca', 'Fraca', 'Regular', 'Boa', 'Excelente'];
    const colors = ['destructive', 'orange', 'yellow', 'primary', 'green'];
    
    return {
      level: levels[Math.min(strength, 4)],
      color: colors[Math.min(strength, 4)],
      percentage: (strength / 5) * 100,
      feedback: feedback.slice(0, 2), // Mostra apenas 2 sugestões
    };
  };

  return {
    errors,
    isValid,
    validateField,
    getPasswordStrength,
  };
};