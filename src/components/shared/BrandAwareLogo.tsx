// DEPRECATED: Use BrandLogo component directly instead of BrandAwareLogo
// This component is deprecated and will be removed in future versions
import { BrandLogo } from "./BrandLogo";

interface BrandAwareLogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

/**
 * @deprecated Use BrandLogo component directly instead
 */
export const BrandAwareLogo = (props: BrandAwareLogoProps) => {
  console.warn('BrandAwareLogo is deprecated. Use BrandLogo component directly instead.');
  // Forward to new BrandLogo component
  return <BrandLogo {...props} />;
};