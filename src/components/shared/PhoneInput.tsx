import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const formatPhoneNumber = (input: string): string => {
      // Remove tudo que não é número
      const numbers = input.replace(/\D/g, '');
      
      // Limita a 9 dígitos
      const limited = numbers.slice(0, 9);
      
      // Aplica formatação XXX XXX XXX
      if (limited.length >= 7) {
        return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
      } else if (limited.length >= 4) {
        return `${limited.slice(0, 3)} ${limited.slice(3)}`;
      } else {
        return limited;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      onChange(formatted);
    };

    const getFullPhoneNumber = (): string => {
      const numbers = value.replace(/\D/g, '');
      return numbers ? `+244${numbers}` : '';
    };

    const isValid = (): boolean => {
      const numbers = value.replace(/\D/g, '');
      // Números angolanos começam com 9 e têm 9 dígitos
      return numbers.length === 9 && numbers.startsWith('9');
    };

    return (
      <div className="space-y-2">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            +244
          </div>
          <Input
            ref={ref}
            type="tel"
            value={value}
            onChange={handleChange}
            className={cn(
              "pl-16 rounded-2xl font-mono",
              !isValid() && value && "border-destructive",
              className
            )}
            {...props}
          />
        </div>
        
        {value && (
          <div className="flex items-center justify-between text-xs">
            <span className={cn(
              "transition-colors",
              isValid() ? "text-green-600" : "text-destructive"
            )}>
              {isValid() ? '✓ Número válido' : '⚠ Formato: 9XX XXX XXX'}
            </span>
            {isValid() && (
              <span className="text-muted-foreground font-mono">
                {getFullPhoneNumber()}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";