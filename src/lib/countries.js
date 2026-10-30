export const COUNTRIES = [
  { code: 'RW', name: 'Rwanda', flag: 'rw' },
  { code: 'UG', name: 'Uganda', flag: 'ug' },
  { code: 'KE', name: 'Kenya', flag: 'ke' },
  { code: 'TZ', name: 'Tanzania', flag: 'tz' },
  { code: 'BI', name: 'Burundi', flag: 'bi' },
  { code: 'CD', name: 'DR Congo', flag: 'cd' },
  { code: 'ET', name: 'Ethiopia', flag: 'et' },
  { code: 'ZA', name: 'South Africa', flag: 'za' },
  { code: 'NG', name: 'Nigeria', flag: 'ng' },
  { code: 'GH', name: 'Ghana', flag: 'gh' },
]

export const COUNTRY_BY_CODE = Object.fromEntries(COUNTRIES.map((country) => [country.code, country]))

export function countryName(code) {
  return COUNTRY_BY_CODE[code]?.name ?? code
}

export function countryFlag(code) {
  return `https://flagcdn.com/w40/${String(code ?? '').toLowerCase()}.png`
}
