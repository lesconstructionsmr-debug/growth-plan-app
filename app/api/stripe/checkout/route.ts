import { NextRequest, NextResponse } from 'next/server'
import { requireCompanyAdmin, apiError } from '@/lib/api/auth'
import {
  appendQuoteMetadata,
  appendSetupFeeLineItem,
  appendSubscriptionLineItem,
  computeTierQuote,
  getPricingTier,
  type PricingTierId,
} from '@/lib/stripe/pricing'

const PROMO_CODES: Record<string, { trialDays: number; label: string }> = {
  'PLANG45': { trialDays: 45, label: '45 jours gratuits' },
  'BIENVENUE30': { trialDays: 30, label: '30 jours gratuits' },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { tier: tierId, promoCode } = body as {
      tier?: PricingTierId
      promoCode?: string
    }

    const tier = getPricingTier(tierId)
    if (!tier) {
      return NextResponse.json({ error: 'Forfait invalide' }, { status: 400 })
    }
    if (tier.contactOnly) {
      return NextResponse.json({ error: 'Contactez-nous pour un devis entreprise' }, { status: 400 })
    }

    const { supabase, user, companyId } = await requireCompanyAdmin()
    const quote = computeTierQuote(tier.id)

    const promo = promoCode ? PROMO_CODES[promoCode.trim().toUpperCase()] : null

    // Vérifier si la compagnie est déjà en cours d'essai ou active
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('status, trial_end')
      .eq('company_id', companyId)
      .maybeSingle()

    // Si déjà inscrit en essai et sans promo spéciale, on applique l'abonnement immédiatement (débit carte instantané)
    const isAlreadyInTrial = existingSub?.status === 'trialing' || existingSub?.status === 'active' || existingSub?.status === 'trial_expired'
    const trialDays = promo ? promo.trialDays : (isAlreadyInTrial ? 0 : 14)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin || 'https://app.growth-plan.ca'

    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('[checkout] STRIPE_SECRET_KEY non configurée sur ce serveur.')
      return NextResponse.json({
        error: 'La passerelle de paiement Stripe n\'est pas encore configurée. Contactez le support.',
      }, { status: 500 })
    }

    const params = new URLSearchParams({
      'mode':                                 'subscription',
      'success_url':                          `${baseUrl}/parametres?session_id={CHECKOUT_SESSION_ID}&success=true`,
      'cancel_url':                           `${baseUrl}/tarifs?annule=1`,
      'billing_address_collection':           'auto',
      'locale':                               'fr-CA',
      'subscription_data[metadata][company_id]': companyId,
      'subscription_data[metadata][user_id]': user.id,
      'subscription_data[metadata][promo_code]': promoCode?.trim().toUpperCase() ?? '',
      'subscription_data[metadata][trial_days]': String(trialDays),
      'subscription_data[metadata][setup_fee_cad]': String(500),
    })

    if (trialDays > 0) {
      params.append('subscription_data[trial_period_days]', String(trialDays))
    }

    // Line item d'abonnement récurrent (annuel)
    appendSubscriptionLineItem(params, quote, 0)
    // Frais d'adhésion uniques (500$) passés dans line_items[1]
    appendSetupFeeLineItem(params, 1)
    appendQuoteMetadata(params, quote)

    if (!promo) params.append('allow_promotion_codes', 'true')
    if (user.email) params.append('customer_email', user.email)

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const session = await res.json()

    if (!res.ok) {
      const errorMsg = session.error?.message || 'Erreur lors de la création de la session Stripe Checkout'
      console.error('[checkout] Stripe error:', session)
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    return NextResponse.json({
      url: session.url,
      trialDays,
      promoApplied: !!promo,
      promoLabel: promo?.label ?? null,
      quote,
    })
  } catch (err) {
    return apiError(err, '[POST /api/stripe/checkout]')
  }
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim().toUpperCase()
  if (!code) return NextResponse.json({ valid: false, error: 'Code manquant' })

  const promo = PROMO_CODES[code]
  if (!promo) return NextResponse.json({ valid: false, error: 'Code invalide ou expiré' }, { status: 404 })

  return NextResponse.json({ valid: true, trialDays: promo.trialDays, label: promo.label })
}
