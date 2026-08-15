import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  SETUP_FEE_CAD,
  PRICING_TIERS,
  PRICING_BASE_MONTHLY_CAD,
  appendSetupFeeLineItem,
  computeTierQuote,
  getPricingTier,
  getSetupPriceId,
} from '@/lib/stripe/pricing'

describe('stripe tier pricing', () => {
  it('expose 4 forfaits dont entreprise sur devis', () => {
    expect(PRICING_TIERS).toHaveLength(4)
    expect(PRICING_BASE_MONTHLY_CAD).toBe(175)
    expect(getPricingTier('entreprise')?.contactOnly).toBe(true)
  })

  it('calcule la quote annuelle pour ÉQUIPE', () => {
    const quote = computeTierQuote('equipe')
    expect(quote.tier.name).toBe('ÉQUIPE')
    expect(quote.displayMonthlyCad).toBe(300)
    expect(quote.billedCad).toBe(3600)
    expect(quote.checkoutCents).toBe(360000)
    expect(quote.interval).toBe('year')
  })

  it('refuse le forfait entreprise au checkout', () => {
    expect(() => computeTierQuote('entreprise')).toThrow(/devis/)
  })

  it('aligne autonome sur 2100$/an', () => {
    const quote = computeTierQuote('autonome')
    expect(quote.billedCad).toBe(2100)
    expect(quote.displayMonthlyCad).toBe(175)
  })
})

describe('stripe setup fee', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('expose 500$ CAD pour les frais d\'adhésion', () => {
    expect(SETUP_FEE_CAD).toBe(500)
  })

  it('utilise STRIPE_PRICE_SETUP si défini', () => {
    vi.stubEnv('STRIPE_PRICE_SETUP', 'price_setup_abc')
    expect(getSetupPriceId()).toBe('price_setup_abc')
  })

  it('crée un price_data inline à 500$ CAD sinon', () => {
    const params = new URLSearchParams()
    appendSetupFeeLineItem(params, 1)
    expect(params.get('line_items[1][price_data][unit_amount]')).toBe('50000')
  })
})
