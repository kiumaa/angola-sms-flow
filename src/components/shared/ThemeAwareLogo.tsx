import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";

interface ThemeAwareLogoProps {
  className?: string;
}

export const ThemeAwareLogo = ({ className = "" }: ThemeAwareLogoProps) => {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`h-8 w-32 bg-gray-200 animate-pulse rounded ${className}`} />;
  }

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";
  const logoSrc = isDark ? logoDark : logoLight;

  return (
    <img 
      src={logoSrc} 
      alt="SMS.AO" 
      className={`h-8 w-auto ${className}`}
    />
  );
};