// Deprecated: Use BrandLogo component instead
import { BrandLogo } from "./BrandLogo";

interface BrandAwareLogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export const BrandAwareLogo = (props: BrandAwareLogoProps) => {
  // Forward to new BrandLogo component
  return <BrandLogo {...props} />;
};