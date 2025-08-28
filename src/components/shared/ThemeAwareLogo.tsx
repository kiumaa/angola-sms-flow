import { useTheme } from "next-themes";
import logoLight from "@/assets/logo-light.png";
import logoDark from "@/assets/logo-dark.png";
import { cn } from "@/lib/utils";

interface ThemeAwareLogoProps {
  className?: string;
}

export const ThemeAwareLogo = ({ className }: ThemeAwareLogoProps) => {
  const { theme, systemTheme } = useTheme();
  
  // Determine current theme
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';
  
  // Select appropriate logo based on theme
  const logoSrc = isDark ? logoDark : logoLight;
  
  return (
    <img 
      src={logoSrc} 
      alt="SMS.AO Logo" 
      className={cn(
        "w-auto h-auto max-w-[140px] px-2 py-[8px] transition-all duration-300",
        className
      )}
    />
  );
};