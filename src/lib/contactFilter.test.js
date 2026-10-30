import { describe, it, expect } from 'vitest'
import { detectContacts } from './contactFilter'

describe('detectContacts', () => {
  it.each([
    ['Call me on 0788 123 456', 'phone'],
    ['+250788123456', 'phone'],
    ['zero seven eight eight one two three four five six', 'phone'],
    ['rimwe kabiri gatatu kane gatanu gatandatu karindwi umunani icyenda', 'phone'],
    ['email me at jean@gmail.com', 'email'],
    ['jean at gmail dot com', 'email'],
    ['visit www.cheapfix.rw', 'url'],
    ['cheapfix dot com', 'url'],
    ['find me @kigali_fixer', 'social'],
    ['message me on whatsapp number', 'social'],
  ])('blocks %s', (text, kind) => {
    const r = detectContacts(text)
    expect(r.blocked).toBe(true)
    expect(r.kinds).toContain(kind)
  })

  it.each(['Does the price include materials?', 'I need 3 rooms painted by Saturday', 'Budget is RWF 25,000'])('allows %s', (text) => {
    expect(detectContacts(text).blocked).toBe(false)
  })
})
