import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

// Lista completa de códigos de país para admins
const ALL_COUNTRY_CODES: CountryCode[] = [
  { code: '+244', country: 'Angola', flag: '🇦🇴' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+1', country: 'Estados Unidos', flag: '🇺🇸' },
  { code: '+44', country: 'Reino Unido', flag: '🇬🇧' },
  { code: '+33', country: 'França', flag: '🇫🇷' },
  { code: '+49', country: 'Alemanha', flag: '🇩🇪' },
  { code: '+39', country: 'Itália', flag: '🇮🇹' },
  { code: '+34', country: 'Espanha', flag: '🇪🇸' },
  { code: '+27', country: 'África do Sul', flag: '🇿🇦' },
  { code: '+234', country: 'Nigéria', flag: '🇳🇬' },
  { code: '+254', country: 'Quênia', flag: '🇰🇪' },
  { code: '+212', country: 'Marrocos', flag: '🇲🇦' },
  { code: '+20', country: 'Egito', flag: '🇪🇬' },
  { code: '+91', country: 'Índia', flag: '🇮🇳' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japão', flag: '🇯🇵' },
  { code: '+82', country: 'Coreia do Sul', flag: '🇰🇷' },
  { code: '+61', country: 'Austrália', flag: '🇦🇺' },
  { code: '+7', country: 'Rússia', flag: '🇷🇺' },
];

// Apenas Angola para clientes
const CLIENT_COUNTRY_CODES: CountryCode[] = [
  { code: '+244', country: 'Angola', flag: '🇦🇴' },
];

interface CountryCodeSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  isAdmin?: boolean;
  placeholder?: string;
}

const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  value,
  onValueChange,
  isAdmin = false,
  placeholder = "Selecionar país"
}) => {
  const countryCodes = isAdmin ? ALL_COUNTRY_CODES : CLIENT_COUNTRY_CODES;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {countryCodes.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            <div className="flex items-center gap-2">
              <span>{country.flag}</span>
              <span className="text-sm font-medium">{country.code}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">{country.country}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CountryCodeSelector;