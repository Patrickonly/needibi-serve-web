import { COUNTRIES, COUNTRY_BY_CODE } from './countries'
import { DISTRICTS } from '@/mocks/seed'

const firstAddressValue = (address, keys) => keys.map((key) => address?.[key]).find(Boolean) ?? ''

// Rwanda's administrative hierarchy is kept here so manual selection and GPS
// results use the same shape. Detail values are service-area choices, not a
// claim about a user's exact private address.
export const RWANDA_PROVINCES = {
  'Kigali City': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
  'Eastern Province': ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
  'Northern Province': ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
  'Southern Province': ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango'],
  'Western Province': ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro'],
}

const DETAIL_OPTIONS = {
  'Kicukiro:Kanombe': {
    cell: ['Kabeza', 'Nyarugunga', 'Busanza'],
    village: ['Kabeza', 'Rukiri', 'Karamira'],
    street: ['KK 114 Street', 'KK 15 Road', 'KK 18 Avenue'],
  },
  'Kicukiro:Mahoro': {
    cell: ['Mahoro', 'Kabeza', 'Nyarugunga'],
    village: ['Mahoro', 'Kabeza', 'Rukiri'],
    street: ['KK 25 Street', 'KK 28 Road', 'KK 31 Avenue'],
  },
  'Gasabo:Kimihurura': {
    cell: ['Kibagabaga', 'Kimihurura', 'Kacyiru'],
    village: ['Inyarurembo', 'Kibagabaga', 'Kacyiru'],
    street: ['KG 9 Avenue', 'KG 7 Avenue', 'KN 5 Street'],
  },
  'Kicukiro:Gikondo': {
    cell: ['Gikondo', 'Rwampara', 'Bwerankori'],
    village: ['Bwerankori', 'Gikondo', 'Kanserege'],
    street: ['KK 15 Road', 'KK 3 Avenue', 'KK 19 Street'],
  },
  'Nyarugenge:Nyamirambo': {
    cell: ['Nyamirambo', 'Rugenge', 'Biryogo'],
    village: ['Rugenge', 'Biryogo', 'Rwezamenyo'],
    street: ['KN 2 Street', 'KN 4 Avenue', 'KN 7 Road'],
  },
}

export const provinceForDistrict = (district) => Object.entries(RWANDA_PROVINCES).find(([, districts]) => districts.includes(district))?.[0] ?? ''

export function locationDetailOptions(district, sector, field) {
  const values = DETAIL_OPTIONS[`${district}:${sector}`]?.[field] ?? []
  if (values.length) return values
  const fallback = {
    cell: district ? [`${sector || district} Centre`, `${sector || district} East`, `${sector || district} West`] : [],
    village: district ? [`${sector || district} Centre`, `${sector || district} Market`, `${sector || district} Hills`] : [],
    street: district ? [`${sector || district} Main Road`, `${sector || district} Avenue`, `${sector || district} Road`] : [],
  }
  return fallback[field] ?? []
}

export function locationDetails(district, sector) {
  return {
    cell: locationDetailOptions(district, sector, 'cell')[0] ?? '',
    village: locationDetailOptions(district, sector, 'village')[0] ?? '',
    street: locationDetailOptions(district, sector, 'street')[0] ?? '',
  }
}

function matchDistrict(address) {
  const values = [address?.district, address?.city_district, address?.county, address?.state_district, address?.municipality, address?.city]
    .filter(Boolean)
    .map((value) => value.toLowerCase())
  const districts = [...new Set(Object.values(RWANDA_PROVINCES).flat())]
  return districts.find((district) => values.some((value) => value.includes(district.toLowerCase()))) ?? ''
}

function matchSector(district, address) {
  const values = [address?.sector, address?.suburb, address?.neighbourhood, address?.quarter, address?.town, address?.village, address?.locality]
    .filter(Boolean)
    .map((value) => value.toLowerCase())
  return (DISTRICTS[district] ?? []).find((sector) => values.some((value) => value.includes(sector.toLowerCase()))) ?? ''
}

function matchCountry(address) {
  const code = address?.country_code?.toUpperCase()
  if (code) return code
  const name = address?.country?.toLowerCase() ?? ''
  return COUNTRIES.find((country) => name.includes(country.name.toLowerCase()))?.code ?? ''
}

export async function reverseGeocode(coords) {
  const params = new URLSearchParams({ format: 'jsonv2', lat: String(coords.latitude), lon: String(coords.longitude), zoom: '18', addressdetails: '1' })
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, { headers: { Accept: 'application/json', 'Accept-Language': 'en' } })
  if (!response.ok) throw new Error('Reverse geocoding failed')
  return response.json()
}

export function parseLocation(result) {
  const address = result?.address ?? {}
  const country = matchCountry(address)
  const district = matchDistrict(address)
  const sector = district ? matchSector(district, address) : ''
  const houseNumber = firstAddressValue(address, ['house_number'])
  const streetName = firstAddressValue(address, ['road', 'pedestrian', 'footway', 'residential'])
  return {
    country,
    countryName: address.country || COUNTRY_BY_CODE[country]?.name || country,
    district,
    sector,
    province: address.state || address.region || '',
    cell: firstAddressValue(address, ['cell', 'quarter', 'neighbourhood', 'suburb']),
    village: firstAddressValue(address, ['village', 'hamlet', 'locality']),
    street: [streetName, houseNumber].filter(Boolean).join(' '),
    displayName: result?.display_name ?? '',
  }
}
