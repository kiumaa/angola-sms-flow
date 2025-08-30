import { detectCountryFromPhone } from './internationalPhoneNormalization';

export interface CountryCostBreakdown {
  countryCode: string;
  countryName: string;
  count: number;
  multiplier: number;
  totalCredits: number;
}

export interface PhoneCostAnalysis {
  totalPhones: number;
  totalCredits: number;
  breakdown: CountryCostBreakdown[];
  hasMultipliers: boolean;
}

export function analyzePhoneNumbersCosts(
  phones: string[], 
  countryPricing: Array<{ country_code: string; country_name: string; credits_multiplier: number; }>
): PhoneCostAnalysis {
  const breakdown = new Map<string, CountryCostBreakdown>();
  
  phones.forEach(phone => {
    const country = detectCountryFromPhone(phone);
    const countryCode = country?.code || '+244'; // Default to Angola
    
    const pricing = countryPricing.find(p => p.country_code === countryCode);
    const multiplier = pricing?.credits_multiplier || 1;
    const countryName = pricing?.country_name || 'Angola';
    
    const key = countryCode;
    if (breakdown.has(key)) {
      const existing = breakdown.get(key)!;
      existing.count += 1;
      existing.totalCredits += multiplier;
    } else {
      breakdown.set(key, {
        countryCode,
        countryName,
        count: 1,
        multiplier,
        totalCredits: multiplier
      });
    }
  });

  const breakdownArray = Array.from(breakdown.values());
  const totalCredits = breakdownArray.reduce((sum, item) => sum + item.totalCredits, 0);
  const hasMultipliers = breakdownArray.some(item => item.multiplier > 1);

  return {
    totalPhones: phones.length,
    totalCredits,
    breakdown: breakdownArray,
    hasMultipliers
  };
}

export function formatCostBreakdown(breakdown: CountryCostBreakdown[]): string {
  return breakdown
    .map(item => {
      const multiplierText = item.multiplier > 1 ? ` (${item.multiplier}x)` : '';
      return `${item.countryName}: ${item.count} SMS${multiplierText} = ${item.totalCredits} créditos`;
    })
    .join(', ');
}