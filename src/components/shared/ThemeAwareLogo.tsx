import { useTheme } from "next-themes";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";

interface ThemeAwareLogoProps {
  height?: number;
  className?: string;
}

export const ThemeAwareLogo = ({ height = 36, className = "" }: ThemeAwareLogoProps) => {
  const { theme, systemTheme } = useTheme();
  
  // Determine current theme
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';
  
  // Select appropriate logo
  const logoSrc = isDark ? logoDark : logoLight;
  
  return (
    <img 
      src={logoSrc}
      alt="Logo"
      className={`h-auto transition-all duration-300 ${className}`}
      style={{ height: `${height}px` }}
    />
  );
};