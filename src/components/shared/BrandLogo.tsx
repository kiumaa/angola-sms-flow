
import { useAdvancedBrandSettings } from "@/hooks/useAdvancedBrandSettings";
import { useTheme } from "next-themes";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: "h-6 w-auto",
  md: "h-8 w-auto", 
  lg: "h-12 w-auto"
};

export const BrandLogo = ({ 
  className,
  showText = false, // Changed default to false
  textClassName = "text-2xl font-bold",
  size = 'md'
}: BrandLogoProps) => {
  const { settings } = useAdvancedBrandSettings();
  const { theme, systemTheme } = useTheme();

  // Determine current theme
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  // Always use local assets, ignore custom URLs for now
  const finalLogo = isDark ? logoDark : logoLight;

  return (
    <div className="flex items-center justify-center">
      {finalLogo ? (
        <img 
          src={finalLogo} 
          alt={settings.site_title} 
          className={cn(sizeClasses[size], className)}
          onError={(e) => {
            // If image fails to load, show fallback
            const parent = e.currentTarget.parentElement;
            e.currentTarget.style.display = 'none';
            if (parent) {
              parent.innerHTML = `
                <svg class="${size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8'} text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              `;
            }
          }}
        />
      ) : (
        <Mail className={cn(
          size === 'sm' ? "h-5 w-5" : size === 'lg' ? "h-10 w-10" : "h-8 w-8",
          "text-primary"
        )} />
      )}
    </div>
  );
};
