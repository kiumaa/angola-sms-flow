import { useState, useMemo, useEffect } from "react";
import { FileText, Upload, AlertCircle, CheckCircle, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CountryCodeSelector } from "./CountryCodeSelector";
import { 
  validateAndNormalizeInternationalPhones,
  parseBulkInternationalPhoneInput,
  DEFAULT_COUNTRY,
  type PhoneCountry 
} from "@/lib/internationalPhoneNormalization";
import { cn } from "@/lib/utils";

interface BulkPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (validation: {
    valid: string[];
    invalid: Array<{ phone: string; error: string; country?: PhoneCountry }>;
    duplicates: number;
    countryStats: Record<string, number>;
  }) => void;
  defaultCountry?: PhoneCountry;
  onCountryChange?: (country: PhoneCountry) => void;
  placeholder?: string;
  className?: string;
}

export function BulkPhoneInput({
  value,
  onChange,
  onValidationChange,
  defaultCountry = DEFAULT_COUNTRY,
  onCountryChange,
  placeholder = "Digite ou cole números de telefone...\nUm número por linha ou separados por vírgula/ponto e vírgula",
  className
}: BulkPhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<PhoneCountry>(defaultCountry);
  const [showValidation, setShowValidation] = useState(false);

  // Parse and validate numbers
  const validation = useMemo(() => {
    if (!value.trim()) {
      return {
        valid: [],
        invalid: [],
        duplicates: 0,
        countryStats: {}
      };
    }

    const phones = parseBulkInternationalPhoneInput(value);
    return validateAndNormalizeInternationalPhones(phones, selectedCountry);
  }, [value, selectedCountry]);

  // Update parent with validation results
  useEffect(() => {
    onValidationChange?.(validation);
  }, [validation, onValidationChange]);

  const handleCountryChange = (country: PhoneCountry) => {
    setSelectedCountry(country);
    onCountryChange?.(country);
  };

  const handleRemoveInvalid = (phoneToRemove: string) => {
    const lines = value.split('\n');
    const newLines = lines.filter(line => {
      const cleanLine = line.trim();
      return cleanLine !== phoneToRemove;
    });
    onChange(newLines.join('\n'));
  };

  const totalNumbers = validation.valid.length + validation.invalid.length;
  const validPercentage = totalNumbers > 0 ? (validation.valid.length / totalNumbers) * 100 : 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Country selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">País padrão:</span>
        <CountryCodeSelector
          value={selectedCountry}
          onChange={handleCountryChange}
        />
      </div>

      {/* Text input */}
      <div className="space-y-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "min-h-32 font-mono text-sm resize-y",
            validation.invalid.length > 0 && value && "border-amber-300 dark:border-amber-700"
          )}
        />
        
        {/* Quick stats */}
        {totalNumbers > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{totalNumbers} números detectados</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowValidation(!showValidation)}
              className="h-6 px-2"
            >
              {showValidation ? 'Ocultar' : 'Ver'} validação
            </Button>
          </div>
        )}
      </div>

      {/* Validation summary */}
      {totalNumbers > 0 && showValidation && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Números válidos</span>
                <span className="font-mono">
                  {validation.valid.length}/{totalNumbers}
                </span>
              </div>
              <Progress value={validPercentage} className="h-2" />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-success">
                  <CheckCircle className="h-3 w-3" />
                  <span>Válidos</span>
                </div>
                <div className="font-mono text-lg">{validation.valid.length}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span>Inválidos</span>
                </div>
                <div className="font-mono text-lg">{validation.invalid.length}</div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-amber-600">
                  <FileText className="h-3 w-3" />
                  <span>Duplicados</span>
                </div>
                <div className="font-mono text-lg">{validation.duplicates}</div>
              </div>

              <div className="space-y-1">
                <div className="text-muted-foreground">Países</div>
                <div className="font-mono text-lg">
                  {Object.keys(validation.countryStats).length}
                </div>
              </div>
            </div>

            {/* Country distribution */}
            {Object.keys(validation.countryStats).length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Distribuição por país:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(validation.countryStats).map(([countryCode, count]) => {
                    const country = [selectedCountry, ...parseBulkInternationalPhoneInput.name ? [] : []]
                      .find(c => c.code === countryCode) || { flag: '🌍', name: countryCode };
                    
                    return (
                      <Badge key={countryCode} variant="outline" className="text-xs">
                        <span className="mr-1">{country.flag}</span>
                        {count}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Invalid numbers */}
            {validation.invalid.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-destructive">
                    Números inválidos ({validation.invalid.length}):
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const validLines = validation.valid.map(phone => {
                        // Convert back to display format for the selected country
                        return phone.replace(selectedCountry.countryCode, '');
                      });
                      onChange(validLines.join('\n'));
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Remover inválidos
                  </Button>
                </div>
                
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {validation.invalid.slice(0, 10).map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-destructive/5 border border-destructive/20 rounded text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-mono truncate">{item.phone}</div>
                        <div className="text-destructive">{item.error}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveInvalid(item.phone)}
                        className="h-6 w-6 p-0 text-destructive hover:bg-destructive/20"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  
                  {validation.invalid.length > 10 && (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      +{validation.invalid.length - 10} números inválidos adicionais
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}