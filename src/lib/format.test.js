import { describe, it, expect } from 'vitest'
import { formatMoney, formatPhone, countdown, initials } from './format'

describe('format', () => {
  it('formats RWF with thousands separators', () => {
    expect(formatMoney(450000)).toBe('RWF 450,000')
    expect(formatMoney({ amount: 382500, currency: 'RWF' })).toBe('RWF 382,500')
  })
  it('formats Rwandan phone numbers', () => {
    expect(formatPhone('0788123456')).toBe('+250 788 123 456')
    expect(formatPhone('250788123456')).toBe('+250 788 123 456')
  })
  it('renders countdowns', () => {
    const now = Date.parse('2026-10-22T10:00:00Z')
    expect(countdown('2026-10-24T14:00:00Z', now)).toBe('2d 04h left')
    expect(countdown('2026-10-22T09:00:00Z', now)).toBe('Ended')
  })
  it('builds initials', () => expect(initials('Aline Mukamana')).toBe('AM'))
})
