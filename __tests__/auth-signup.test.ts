import { describe, it, expect } from 'vitest'
import { isDuplicateSignup } from '@/lib/auth/site-url'
import { buildAuthCallbackUrl, escapeHtml } from '@/lib/email/links'

describe('isDuplicateSignup', () => {
  it('détecte un signUp silencieux (identities vides)', () => {
    expect(isDuplicateSignup({ identities: [] })).toBe(true)
    expect(isDuplicateSignup({ identities: null })).toBe(true)
    expect(isDuplicateSignup({ identities: undefined })).toBe(true)
  })

  it('laisse passer un vrai nouvel utilisateur', () => {
    expect(isDuplicateSignup({ identities: [{ id: 'email' }] })).toBe(false)
  })

  it('ignore un user absent', () => {
    expect(isDuplicateSignup(null)).toBe(false)
    expect(isDuplicateSignup(undefined)).toBe(false)
  })
})

describe('liens email Auth', () => {
  it('échappe le HTML dans l’adresse', () => {
    expect(escapeHtml('a<b>@"x"')).toBe('a&lt;b&gt;@&quot;x&quot;')
  })

  it('construit le callback token_hash', () => {
    expect(buildAuthCallbackUrl('abc123', 'signup', 'https://app.growth-plan.ca')).toBe(
      'https://app.growth-plan.ca/auth/callback?token_hash=abc123&type=signup'
    )
  })
})
