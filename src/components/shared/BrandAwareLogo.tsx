import { useBrandSettings } from "@/hooks/useBrandSettings";
import { Mail } from "lucide-react";
import logo from "@/assets/logo.png";

interface BrandAwareLogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export const BrandAwareLogo = ({ 
  className = "h-8 w-auto mr-2", 
  showText = true,
  textClassName = "text-2xl font-bold text-gradient"
}: BrandAwareLogoProps) => {
  const { settings } = useBrandSettings();
  
  const logoSrc = settings?.logo_url || logo;
  const hasCustomLogo = !!settings?.logo_url;

  return (
    <div className="flex items-center">
      {hasCustomLogo ? (
        <img src={logoSrc} alt="SMS AO" className={className} />
      ) : (
        <>
          <Mail className="h-8 w-8 text-primary mr-2" />
          {showText && (
            <span className={textClassName}>SMS AO</span>
          )}
        </>
      )}
    </div>
  );
};