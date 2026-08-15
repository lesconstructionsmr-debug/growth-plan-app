import { describe, it, expect, beforeEach, vi } from 'vitest'
import { normalizeStatut, DEVIS_EN_ATTENTE, FACTURES_IMPAYEES } from '@/lib/status'

describe('normalizeStatut', () => {
  it('convertit les statuts accentués vers la convention ASCII', () => {
    expect(normalizeStatut('envoyé', 'brouillon')).toBe('envoye')
    expect(normalizeStatut('envoyée', 'brouillon')).toBe('envoyee')
    expect(normalizeStatut('approuvé', 'brouillon')).toBe('approuve')
    expect(normalizeStatut('payée', 'brouillon')).toBe('payee')
  })

  it('laisse passer les statuts déjà normalisés', () => {
    expect(normalizeStatut('envoye', 'brouillon')).toBe('envoye')
    expect(normalizeStatut('approuve', 'brouillon')).toBe('approuve')
  })

  it('retourne le fallback si statut absent', () => {
    expect(normalizeStatut(null, 'brouillon')).toBe('brouillon')
    expect(normalizeStatut(undefined, 'envoye')).toBe('envoye')
  })
})

describe('constantes statuts', () => {
  it('DEVIS_EN_ATTENTE contient envoye et vu', () => {
    expect(DEVIS_EN_ATTENTE).toContain('envoye')
    expect(DEVIS_EN_ATTENTE).toContain('vu')
  })

  it('FACTURES_IMPAYEES inclut en_retard', () => {
    expect(FACTURES_IMPAYEES).toContain('en_retard')
  })
})

describe('validation token portail', () => {
  function isValidPortalToken(token: string): boolean {
    return typeof token === 'string' && token.length >= 32 && /^[a-f0-9]+$/i.test(token)
  }

  it('accepte un token hex de 48 caractères', () => {
    expect(isValidPortalToken('a'.repeat(48))).toBe(true)
  })

  it('rejette un token trop court ou non hex', () => {
    expect(isValidPortalToken('abc')).toBe(false)
    expect(isValidPortalToken('g'.repeat(48))).toBe(false)
  })
})

describe('isPlatformAdmin', () => {
  beforeEach(() => {
    vi.stubEnv('PLATFORM_ADMIN_EMAILS', 'admin@growth-plan.ca,owner@example.com')
  })

  it('autorise les emails listés', async () => {
    const { isPlatformAdmin } = await import('@/lib/platform-admin')
    expect(isPlatformAdmin('admin@growth-plan.ca')).toBe(true)
    expect(isPlatformAdmin('OWNER@example.com')).toBe(true)
  })

  it('refuse les emails non listés', async () => {
    const { isPlatformAdmin } = await import('@/lib/platform-admin')
    expect(isPlatformAdmin('user@client.com')).toBe(false)
    expect(isPlatformAdmin(null)).toBe(false)
  })
})

describe('rate limit chat', () => {
  it('bloque après le quota', async () => {
    const { checkRateLimit } = await import('@/lib/api/rate-limit')
    const key = `test-${Date.now()}`
    const opts = { maxRequests: 2, windowMs: 60_000 }

    expect(checkRateLimit(key, opts).allowed).toBe(true)
    expect(checkRateLimit(key, opts).allowed).toBe(true)
    expect(checkRateLimit(key, opts).allowed).toBe(false)
  })
})

describe('resolveCompanyId webhook', () => {
  it('priorise metadata.company_id', async () => {
    const { resolveCompanyIdFromSubscription } = await import('@/lib/stripe/subscription')
    const id = resolveCompanyIdFromSubscription(
      { metadata: { company_id: 'uuid-123' }, customer: 'cus_x' },
      { existingCompanyId: 'uuid-old', emailCompanyId: 'uuid-email' }
    )
    expect(id).toBe('uuid-123')
  })

  it('fallback sur stripe_customer_id existant', async () => {
    const { resolveCompanyIdFromSubscription } = await import('@/lib/stripe/subscription')
    const id = resolveCompanyIdFromSubscription(
      { metadata: {}, customer: 'cus_x' },
      { existingCompanyId: 'uuid-old', emailCompanyId: null }
    )
    expect(id).toBe('uuid-old')
  })
})
