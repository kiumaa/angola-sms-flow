import { useAdvancedBrandSettings } from "@/hooks/useAdvancedBrandSettings";
import { useTheme } from "next-themes";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: "h-5 w-auto",
  md: "h-7 w-auto", 
  lg: "h-10 w-auto"
};

export const BrandLogo = ({ 
  className,
  showText = true,
  textClassName = "text-2xl font-bold",
  size = 'md'
}: BrandLogoProps) => {
  const { settings } = useAdvancedBrandSettings();
  const { theme, systemTheme } = useTheme();

  // Determine current theme
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  // Select appropriate logo based on theme
  const logoUrl = isDark ? settings.logo_dark_url : settings.logo_light_url;
  const fallbackLogo = !isDark ? settings.logo_dark_url : settings.logo_light_url;

  // Use logo if available, otherwise fallback to icon + text
  const finalLogo = logoUrl || fallbackLogo;

  return (
    <div className="flex items-center">
      {finalLogo ? (
        <img 
          src={finalLogo} 
          alt={settings.site_title} 
          className={cn(sizeClasses[size], className)}
          onError={(e) => {
            // If image fails to load, hide it and show fallback
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <>
          <Mail className={cn(
            size === 'sm' ? "h-5 w-5" : size === 'lg' ? "h-10 w-10" : "h-8 w-8",
            "text-primary mr-2"
          )} />
          {showText && (
            <span className={cn(
              size === 'sm' ? "text-lg" : size === 'lg' ? "text-3xl" : "text-2xl",
              "font-bold text-primary",
              textClassName
            )}>
              {settings.site_title}
            </span>
          )}
        </>
      )}
    </div>
  );
};