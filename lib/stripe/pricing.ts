/** Frais unique d'adhésion — configuration API, QuickBooks, intégrations tierces. */
export const SETUP_FEE_CAD = 500

export const SETUP_FEE_LABEL =
  "Frais d'adhésion — configuration API & intégrations (QuickBooks, etc.)"

export type PricingTierId = 'autonome' | 'equipe' | 'croissance' | 'entreprise'

export type PricingTier = {
  id: PricingTierId
  name: string
  subtitle: string
  usersLabel: string
  /** Équivalent mensuel affiché (facturation annuelle). */
  monthlyDisplayCad: number
  /** Paiement unique annuel — engagement 12 mois. */
  annualTotalCad: number
  minUsers: number
  maxUsers: number | null
  popular?: boolean
  contactOnly?: boolean
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'autonome',
    name: 'AUTONOME',
    subtitle: 'Pour les travailleurs autonomes',
    usersLabel: '1 à 2 utilisateurs avec accès app',
    monthlyDisplayCad: 175,
    annualTotalCad: 2100,
    minUsers: 1,
    maxUsers: 2,
  },
  {
    id: 'equipe',
    name: 'ÉQUIPE',
    subtitle: 'Pour les petites équipes',
    usersLabel: '3 à 10 utilisateurs avec accès app',
    monthlyDisplayCad: 300,
    annualTotalCad: 3600,
    minUsers: 3,
    maxUsers: 10,
    popular: true,
  },
  {
    id: 'croissance',
    name: 'CROISSANCE',
    subtitle: 'Pour les entreprises en croissance',
    usersLabel: '11 à 20 utilisateurs avec accès app',
    monthlyDisplayCad: 450,
    annualTotalCad: 5400,
    minUsers: 11,
    maxUsers: 20,
  },
  {
    id: 'entreprise',
    name: 'ENTREPRISE',
    subtitle: 'Pour les grandes équipes',
    usersLabel: 'Plus de 20 utilisateurs avec accès app',
    monthlyDisplayCad: 0,
    annualTotalCad: 0,
    minUsers: 21,
    maxUsers: null,
    contactOnly: true,
  },
]

export const TIER_FEATURE_BULLETS = [
  'Toutes les fonctionnalités',
  'Application mobile',
  'Support inclus',
] as const

/** Forfait le moins cher — à partir de. */
export const PRICING_BASE_MONTHLY_CAD = PRICING_TIERS[0].monthlyDisplayCad

/** Alias rétrocompatibilité. */
export const SUBSCRIPTION_MONTHLY_CAD = PRICING_BASE_MONTHLY_CAD

export type PricingQuote = {
  tier: PricingTier
  monthlyCad: number
  billedCad: number
  displayMonthlyCad: number
  checkoutCents: number
  interval: 'year'
  productName: string
}

export function formatPriceCad(amount: number): string {
  return amount.toLocaleString('fr-CA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function getPricingTier(id: string | null | undefined): PricingTier | null {
  if (!id) return null
  return PRICING_TIERS.find(t => t.id === id) ?? null
}

export function computeTierQuote(tierId: PricingTierId): PricingQuote {
  const tier = getPricingTier(tierId)
  if (!tier) throw new Error('Forfait invalide')
  if (tier.contactOnly) throw new Error('Forfait sur devis — contactez-nous')

  return {
    tier,
    monthlyCad: tier.monthlyDisplayCad,
    billedCad: tier.annualTotalCad,
    displayMonthlyCad: tier.monthlyDisplayCad,
    checkoutCents: Math.round(tier.annualTotalCad * 100),
    interval: 'year',
    productName: `Plan Growth — ${tier.name}`,
  }
}

export function getSetupPriceId(): string | undefined {
  return process.env.STRIPE_PRICE_SETUP || process.env.STRIPE_PRICE_ADHESION
}

export function getTierStripePriceId(tierId: PricingTierId): string | undefined {
  const envMap: Record<PricingTierId, string | undefined> = {
    autonome: process.env.STRIPE_PRICE_TIER_AUTONOME,
    equipe: process.env.STRIPE_PRICE_TIER_EQUIPE,
    croissance: process.env.STRIPE_PRICE_TIER_CROISSANCE,
    entreprise: undefined,
  }
  return envMap[tierId]
}

/** Ligne d'abonnement annuel pour le forfait choisi. */
export function appendSubscriptionLineItem(
  params: URLSearchParams,
  quote: PricingQuote,
  index = 0
) {
  const prefix = `line_items[${index}]`
  const priceId = getTierStripePriceId(quote.tier.id)

  if (priceId) {
    params.set(`${prefix}[price]`, priceId)
    params.set(`${prefix}[quantity]`, '1')
    return
  }

  params.set(`${prefix}[price_data][currency]`, 'cad')
  params.set(`${prefix}[price_data][unit_amount]`, String(quote.checkoutCents))
  params.set(`${prefix}[price_data][recurring][interval]`, quote.interval)
  params.set(`${prefix}[price_data][product_data][name]`, quote.productName)
  params.set(`${prefix}[quantity]`, '1')
}

export function appendSetupFeeLineItem(params: URLSearchParams, index = 1) {
  const priceId = getSetupPriceId()
  const prefix = `line_items[${index}]`

  if (priceId) {
    params.set(`${prefix}[price]`, priceId)
    params.set(`${prefix}[quantity]`, '1')
    return
  }

  params.set(`${prefix}[price_data][currency]`, 'cad')
  params.set(`${prefix}[price_data][unit_amount]`, String(SETUP_FEE_CAD * 100))
  params.set(`${prefix}[price_data][product_data][name]`, SETUP_FEE_LABEL)
  params.set(`${prefix}[quantity]`, '1')
}

export function appendQuoteMetadata(
  params: URLSearchParams,
  quote: PricingQuote,
  extra: Record<string, string> = {}
) {
  const entries: Record<string, string> = {
    pricing_tier: quote.tier.id,
    tier_name: quote.tier.name,
    users_label: quote.tier.usersLabel,
    min_users: String(quote.tier.minUsers),
    max_users: quote.tier.maxUsers != null ? String(quote.tier.maxUsers) : 'unlimited',
    monthly_display_cad: String(quote.displayMonthlyCad),
    billed_cad: String(quote.billedCad),
    billing_period: 'annuel',
    ...extra,
  }

  for (const [key, value] of Object.entries(entries)) {
    params.set(`subscription_data[metadata][${key}]`, value)
  }
}
