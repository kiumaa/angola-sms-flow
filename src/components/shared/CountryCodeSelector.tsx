import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SUPPORTED_COUNTRIES, DEFAULT_COUNTRY, type PhoneCountry } from "@/lib/internationalPhoneNormalization";

interface CountryCodeSelectorProps {
  value?: PhoneCountry;
  onChange: (country: PhoneCountry) => void;
  disabled?: boolean;
  className?: string;
}

export function CountryCodeSelector({ 
  value = DEFAULT_COUNTRY, 
  onChange, 
  disabled = false,
  className 
}: CountryCodeSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-[140px] justify-between font-mono text-sm",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{value.flag}</span>
            <span className="font-semibold">{value.countryCode}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar país..." />
          <CommandEmpty>Nenhum país encontrado.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {SUPPORTED_COUNTRIES.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.countryCode} ${country.code}`}
                  onSelect={() => {
                    onChange(country);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{country.flag}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{country.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {country.countryCode} • {country.example}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      {country.countryCode}
                    </span>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value.code === country.code ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}