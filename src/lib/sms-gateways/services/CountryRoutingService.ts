export interface CountryInfo {
  code: string;
  name: string;
  phonePrefix: string;
  preferredGateway: string;
  costMultiplier: number;
}

export class CountryRoutingService {
  private countryMap: Map<string, CountryInfo> = new Map();

  constructor() {
    this.initializeCountryData();
  }

  private initializeCountryData() {
    const countries: CountryInfo[] = [
      {
        code: 'AO',
        name: 'Angola',
        phonePrefix: '+244',
        preferredGateway: 'bulkgate',
        costMultiplier: 1.0
      },
      {
        code: 'PT',
        name: 'Portugal',
        phonePrefix: '+351',
        preferredGateway: 'bulksms',
        costMultiplier: 1.2
      },
      {
        code: 'BR',
        name: 'Brazil',
        phonePrefix: '+55',
        preferredGateway: 'bulksms',
        costMultiplier: 1.1
      },
      {
        code: 'MZ',
        name: 'Mozambique',
        phonePrefix: '+258',
        preferredGateway: 'bulkgate',
        costMultiplier: 1.0
      },
      {
        code: 'CV',
        name: 'Cape Verde',
        phonePrefix: '+238',
        preferredGateway: 'bulkgate',
        costMultiplier: 1.3
      },
      {
        code: 'GW',
        name: 'Guinea-Bissau',
        phonePrefix: '+245',
        preferredGateway: 'bulkgate',
        costMultiplier: 1.4
      },
      {
        code: 'ST',
        name: 'São Tomé and Príncipe',
        phonePrefix: '+239',
        preferredGateway: 'bulkgate',
        costMultiplier: 1.5
      },
      {
        code: 'TL',
        name: 'East Timor',
        phonePrefix: '+670',
        preferredGateway: 'bulkgate',
        costMultiplier: 1.6
      },
      {
        code: 'US',
        name: 'United States',
        phonePrefix: '+1',
        preferredGateway: 'bulksms',
        costMultiplier: 0.8
      },
      {
        code: 'GB',
        name: 'United Kingdom',
        phonePrefix: '+44',
        preferredGateway: 'bulksms',
        costMultiplier: 0.9
      },
      {
        code: 'DE',
        name: 'Germany',
        phonePrefix: '+49',
        preferredGateway: 'bulksms',
        costMultiplier: 0.9
      },
      {
        code: 'FR',
        name: 'France',
        phonePrefix: '+33',
        preferredGateway: 'bulksms',
        costMultiplier: 0.9
      },
      {
        code: 'ES',
        name: 'Spain',
        phonePrefix: '+34',
        preferredGateway: 'bulksms',
        costMultiplier: 0.9
      },
      {
        code: 'IT',
        name: 'Italy',
        phonePrefix: '+39',
        preferredGateway: 'bulksms',
        costMultiplier: 0.9
      }
    ];

    countries.forEach(country => {
      this.countryMap.set(country.code, country);
      this.countryMap.set(country.phonePrefix, country);
    });
  }

  detectCountryFromPhone(phoneNumber: string): string {
    // Normalize phone number - remove spaces, dashes, etc.
    const normalized = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Check if it starts with +
    if (normalized.startsWith('+')) {
      // Try to match exact prefixes first (longest to shortest)
      const sortedPrefixes = Array.from(this.countryMap.keys())
        .filter(key => key.startsWith('+'))
        .sort((a, b) => b.length - a.length);

      for (const prefix of sortedPrefixes) {
        if (normalized.startsWith(prefix)) {
          const country = this.countryMap.get(prefix);
          return country?.code || 'UNKNOWN';
        }
      }
    }

    // Handle Angola specifically (+244)
    if (normalized.startsWith('244') || normalized.startsWith('+244')) {
      return 'AO';
    }

    // Handle other PALOP countries
    if (normalized.startsWith('351')) return 'PT'; // Portugal
    if (normalized.startsWith('258')) return 'MZ'; // Mozambique
    if (normalized.startsWith('238')) return 'CV'; // Cape Verde
    if (normalized.startsWith('245')) return 'GW'; // Guinea-Bissau
    if (normalized.startsWith('239')) return 'ST'; // São Tomé
    if (normalized.startsWith('670')) return 'TL'; // East Timor

    // Default fallback
    return 'UNKNOWN';
  }

  getPreferredGateway(countryCode: string): string {
    const country = this.countryMap.get(countryCode);
    return country?.preferredGateway || 'bulksms';
  }

  getCostMultiplier(countryCode: string): number {
    const country = this.countryMap.get(countryCode);
    return country?.costMultiplier || 1.0;
  }

  getCountryInfo(countryCode: string): CountryInfo | null {
    return this.countryMap.get(countryCode) || null;
  }

  getAllCountries(): CountryInfo[] {
    return Array.from(this.countryMap.values())
      .filter(country => country.code !== country.phonePrefix) // Remove duplicates
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  isAngolanNumber(phoneNumber: string): boolean {
    return this.detectCountryFromPhone(phoneNumber) === 'AO';
  }

  isPALOPCountry(countryCode: string): boolean {
    const palopCountries = ['AO', 'PT', 'BR', 'MZ', 'CV', 'GW', 'ST', 'TL'];
    return palopCountries.includes(countryCode);
  }

  getOptimalRoutingForBatch(phoneNumbers: string[]): {
    bulkgate: string[];
    bulksms: string[];
    summary: {
      total: number;
      bulkgateCount: number;
      bulksmsCount: number;
      angolaCount: number;
      internationalCount: number;
    };
  } {
    const bulkgate: string[] = [];
    const bulksms: string[] = [];
    let angolaCount = 0;
    let internationalCount = 0;

    phoneNumbers.forEach(phone => {
      const countryCode = this.detectCountryFromPhone(phone);
      const preferredGateway = this.getPreferredGateway(countryCode);

      if (preferredGateway === 'bulkgate') {
        bulkgate.push(phone);
        if (countryCode === 'AO') angolaCount++;
      } else {
        bulksms.push(phone);
        if (countryCode !== 'AO') internationalCount++;
      }
    });

    return {
      bulkgate,
      bulksms,
      summary: {
        total: phoneNumbers.length,
        bulkgateCount: bulkgate.length,
        bulksmsCount: bulksms.length,
        angolaCount,
        internationalCount
      }
    };
  }
}