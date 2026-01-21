// EU Member States with ISO codes and flag emojis
export interface Country {
  code: string
  name: string
  flag: string
  label: string // For USelectMenu display
}

// 27 EU Member States (as of 2024)
export const countries: Country[] = [
  { code: 'AT', name: 'Austria', flag: '🇦🇹', label: '🇦🇹 Austria' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', label: '🇧🇪 Belgium' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', label: '🇧🇬 Bulgaria' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', label: '🇭🇷 Croatia' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', label: '🇨🇾 Cyprus' },
  { code: 'CZ', name: 'Czechia', flag: '🇨🇿', label: '🇨🇿 Czechia' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', label: '🇩🇰 Denmark' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', label: '🇪🇪 Estonia' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', label: '🇫🇮 Finland' },
  { code: 'FR', name: 'France', flag: '🇫🇷', label: '🇫🇷 France' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', label: '🇩🇪 Germany' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', label: '🇬🇷 Greece' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', label: '🇭🇺 Hungary' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', label: '🇮🇪 Ireland' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', label: '🇮🇹 Italy' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', label: '🇱🇻 Latvia' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', label: '🇱🇹 Lithuania' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', label: '🇱🇺 Luxembourg' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', label: '🇲🇹 Malta' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', label: '🇳🇱 Netherlands' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', label: '🇵🇱 Poland' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', label: '🇵🇹 Portugal' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', label: '🇷🇴 Romania' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', label: '🇸🇰 Slovakia' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', label: '🇸🇮 Slovenia' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', label: '🇪🇸 Spain' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', label: '🇸🇪 Sweden' }
]

// Get country by ISO code
export function getCountryByCode(code: string): Country | undefined {
  return countries.find(c => c.code === code)
}

// Search countries by name or code
export function searchCountries(query: string): Country[] {
  const normalizedQuery = query.toLowerCase().trim()
  if (!normalizedQuery) return countries

  return countries.filter(c =>
    c.name.toLowerCase().includes(normalizedQuery) ||
    c.code.toLowerCase().includes(normalizedQuery)
  )
}

// Format country for display
export function formatCountry(country: Country): string {
  return `${country.flag} ${country.name}`
}
