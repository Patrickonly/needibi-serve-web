// Real photos (Wikimedia Commons + Unsplash, free licences — credits in /public/img/credits.json).
// Every item maps to a photo by keywords in its title, then its subtype, then its category.

export const CATEGORY_IMAGE = {
  agriculture: 'cat-agriculture', automotive: 'cat-automotive', beauty: 'cat-beauty', education: 'cat-education',
  electronics: 'cat-electronics', 'food-catering': 'cat-food', health: 'cat-health', 'home-furniture': 'cat-home',
  'real-estate': 'cat-realestate', 'professional-talent': 'cat-professional', services: 'cat-services',
  'travel-tourism': 'cat-travel', 'custom-solutions': 'cat-custom',
}

// Most specific first
const RULES = [
  [/plumb|leak|pipe|sink/, 'plumbing'], [/gorilla/, 'gorilla'], [/kivu/, 'kivu'], [/safari|akagera|holiday/, 'safari'],
  [/airport|transfer/, 'airport'], [/moto\b|moto taxi/, 'moto'],
  [/brake|battery|car service|repair car|mechanic/, 'car-repair'], [/car wash|wash/, 'car-wash'], [/hire|driver|rav4|suv|field trip|car /, 'car-hire'],
  [/braid|hair/, 'hair'], [/make-up|makeup|glam/, 'makeup'], [/massage|spa/, 'massage'], [/barber/, 'barber'],
  [/python|coding|bootcamp|computer/, 'coding'], [/piano|music/, 'piano'], [/tutor|maths|math|lesson|classes|french|kinyarwanda|course/, 'tutoring'],
  [/iphone|screen repair|phone/, 'phone-repair'], [/solar/, 'solar'], [/wi-fi|wifi|laptop/, 'laptop'], [/tv|sound bar|television/, 'tv'],
  [/cake/, 'cake'], [/chef|dinner/, 'chef'], [/lunch|meal plan/, 'lunch'], [/brochette|grill/, 'brochette'],
  [/catering|buffet|guests|party for/, 'catering'], [/nurse/, 'nurse'], [/physio/, 'physio'], [/blood|lab|pharmacy/, 'lab'],
  [/office space|serviced office|desk —/, 'office-space'], [/office set|desks|12-desk|12 staff/, 'office-setup'],
  [/apartment|studio|2-bed|flat/, 'apartment'], [/plot|land/, 'land'], [/short stay|hotel|stay/, 'hotel'],
  [/bookkeeping|accountant|accounting/, 'accounting'], [/lawyer|legal|contract/, 'legal'], [/logo|brand kit|branding/, 'design'],
  [/photo|shoot|photographer/, 'photography'], [/website|web /, 'website'], [/translat/, 'tutoring'],
  [/guard|security/, 'security'], [/laundry/, 'laundry'], [/garden/, 'garden'], [/fumigat|pest/, 'pest'],
  [/deliver|documents/, 'delivery'], [/wedding|bridal/, 'wedding'], [/uniform|tailor/, 'uniforms'], [/kiosk|stall/, 'kiosk'],
  [/seed|maize/, 'seeds'], [/fertili|npk/, 'fertiliser'], [/harvest|farm workers|farm labour/, 'harvest'],
  [/cow|vet|livestock|cattle/, 'cows'], [/irrigation/, 'irrigation'], [/groceries|supplies/, 'groceries'],
  [/end-of-year|corporate party|party/, 'party'], [/sofa|couch|furnish/, 'sofa'], [/wardrobe|bed\b|bedroom/, 'wardrobe'],
  [/moving|move house|van/, 'moving'], [/roof/, 'roof'], [/paint|renovat/, 'painting'], [/electric|rewire/, 'electrical'],
  [/clean/, 'cleaning'], [/carpent|wall|mason|custom build/, 'carpentry'],
]
const SUBTYPE = {
  plumbing: 'plumbing', electrical: 'electrical', cleaning: 'cleaning', furniture: 'sofa', painting: 'painting', carpentry: 'carpentry',
  moving: 'moving', 'car hire': 'car-hire', repairs: 'car-repair', 'car wash': 'car-wash', 'driver hire': 'car-hire', 'moto transport': 'moto',
  hair: 'hair', 'make-up': 'makeup', massage: 'massage', barber: 'barber', tutoring: 'tutoring', coding: 'coding', 'music lessons': 'piano',
  phones: 'phone-repair', laptops: 'laptop', 'solar & power': 'solar', 'tv & sound': 'tv', 'event catering': 'catering', cakes: 'cake',
  'office lunch': 'lunch', 'meal plans': 'lunch', 'private chef': 'chef', 'home nursing': 'nurse', physiotherapy: 'physio', 'lab tests': 'lab',
  apartments: 'apartment', houses: 'apartment', 'office space': 'office-space', land: 'land', 'short stay': 'hotel', accounting: 'accounting',
  legal: 'legal', design: 'design', software: 'website', photography: 'photography', security: 'security', laundry: 'laundry',
  gardening: 'garden', 'pest control': 'pest', delivery: 'delivery', 'safari tours': 'safari', 'gorilla trekking': 'gorilla',
  'airport transfer': 'airport', hotels: 'hotel', 'lake kivu trips': 'kivu', 'event planning': 'party', 'office set-up': 'office-setup',
  branding: 'design', 'seeds & inputs': 'seeds', 'farm labour': 'harvest', irrigation: 'irrigation', 'livestock care': 'cows', 'harvest transport': 'harvest',
}

export function imageKeyFor(item) {
  if (!item) return 'cat-services'
  const title = `${item.title ?? ''} `.toLowerCase()
  for (const [re, key] of RULES) if (re.test(title)) return key === 'plumbing' && (item.id ?? '').length % 2 ? 'plumbing-2' : key
  const sub = SUBTYPE[(item.subtype ?? '').toLowerCase()]
  if (sub) return sub
  return CATEGORY_IMAGE[item.category] ?? 'cat-services'
}

export const imgSrc = (key, size = 400) => `/img/${key}-${size}.webp`
export const imgSrcSet = (key) => `/img/${key}-400.webp 400w, /img/${key}-800.webp 800w`
