import { describe, it, expect } from 'vitest'
import { decodeStripeWebhookSecret } from '@/lib/stripe/webhook-signature'

describe('decodeStripeWebhookSecret', () => {
  it('décode whsec_ en base64 (format Stripe)', () => {
    const raw = Buffer.from('test-signing-secret-bytes!!', 'utf8')
    const whsec = `whsec_${raw.toString('base64')}`
    const decoded = new Uint8Array(decodeStripeWebhookSecret(whsec))
    expect(Buffer.from(decoded).toString('utf8')).toBe('test-signing-secret-bytes!!')
  })

  it('ne traite pas whsec_ comme texte brut', () => {
    const whsec = 'whsec_' + Buffer.from('abc').toString('base64')
    const decoded = new Uint8Array(decodeStripeWebhookSecret(whsec))
    expect(Buffer.from(decoded).toString('utf8')).toBe('abc')
  })
})
