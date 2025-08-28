import { forwardRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { CountryCodeSelector } from "./CountryCodeSelector";
import { cn } from "@/lib/utils";
import { 
  normalizeInternationalPhone, 
  formatPhoneForDisplay, 
  detectCountryFromPhone,
  DEFAULT_COUNTRY,
  type PhoneCountry 
} from "@/lib/internationalPhoneNormalization";

interface InternationalPhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  country?: PhoneCountry;
  onCountryChange?: (country: PhoneCountry) => void;
  showValidation?: boolean;
  autoDetectCountry?: boolean;
}

export const InternationalPhoneInput = forwardRef<HTMLInputElement, InternationalPhoneInputProps>(
  ({ 
    className, 
    value, 
    onChange, 
    country = DEFAULT_COUNTRY,
    onCountryChange,
    showValidation = true,
    autoDetectCountry = true,
    ...props 
  }, ref) => {
    const [selectedCountry, setSelectedCountry] = useState<PhoneCountry>(country);
    const [displayValue, setDisplayValue] = useState("");

    // Update display value when value or country changes
    useEffect(() => {
      if (value) {
        const formatted = formatPhoneForDisplay(value, selectedCountry);
        setDisplayValue(formatted);
      } else {
        setDisplayValue("");
      }
    }, [value, selectedCountry]);

    // Auto-detect country when typing
    useEffect(() => {
      if (autoDetectCountry && value && !value.startsWith(selectedCountry.countryCode)) {
        const detected = detectCountryFromPhone(value);
        if (detected && detected.code !== selectedCountry.code) {
          setSelectedCountry(detected);
          onCountryChange?.(detected);
        }
      }
    }, [value, autoDetectCountry, selectedCountry, onCountryChange]);

    const handleCountryChange = (newCountry: PhoneCountry) => {
      setSelectedCountry(newCountry);
      onCountryChange?.(newCountry);
      
      // If there's a value, try to reformat it for the new country
      if (value && !value.startsWith(newCountry.countryCode)) {
        const result = normalizeInternationalPhone(value, newCountry);
        if (result.ok && result.e164) {
          onChange(result.e164);
        }
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setDisplayValue(inputValue);
      
      // Normalize the input
      const result = normalizeInternationalPhone(inputValue, selectedCountry);
      
      if (result.ok && result.e164) {
        onChange(result.e164);
        
        // Auto-detect country if different
        if (autoDetectCountry && result.detectedCountry && 
            result.detectedCountry.code !== selectedCountry.code) {
          setSelectedCountry(result.detectedCountry);
          onCountryChange?.(result.detectedCountry);
        }
      } else {
        // Pass the raw input for partial validation
        onChange(inputValue);
      }
    };

    const getValidationResult = () => {
      if (!value) return null;
      return normalizeInternationalPhone(value, selectedCountry);
    };

    const validationResult = getValidationResult();
    const isValid = validationResult?.ok;
    const hasError = value && !isValid;

    const getValidationMessage = (): string => {
      if (!validationResult || !value) return "";
      
      if (validationResult.ok) {
        return `✓ Número válido (${selectedCountry.name})`;
      }
      
      switch (validationResult.reason) {
        case `invalid_length_${selectedCountry.code}`:
          return `⚠ Formato: ${selectedCountry.format}`;
        case `invalid_mobile_prefix_${selectedCountry.code}`:
          return `⚠ Número deve começar com ${selectedCountry.mobileStarts.join(', ')}`;
        default:
          return `⚠ Formato inválido para ${selectedCountry.name}`;
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <CountryCodeSelector
            value={selectedCountry}
            onChange={handleCountryChange}
          />
          <Input
            ref={ref}
            type="tel"
            value={displayValue}
            onChange={handleInputChange}
            placeholder={selectedCountry.example}
            className={cn(
              "font-mono",
              hasError && "border-destructive",
              isValid && "border-success",
              className
            )}
            {...props}
          />
        </div>
        
        {showValidation && value && (
          <div className="flex items-center justify-between text-xs">
            <span className={cn(
              "transition-colors",
              isValid ? "text-success" : "text-destructive"
            )}>
              {getValidationMessage()}
            </span>
            {isValid && validationResult?.e164 && (
              <span className="text-muted-foreground font-mono">
                {validationResult.e164}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

InternationalPhoneInput.displayName = "InternationalPhoneInput";